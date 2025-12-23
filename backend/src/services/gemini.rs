use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;

use crate::error::{AppError, AppResult};
use crate::models::{Question, SolutionStep};
use crate::services::PromptLoader;

const GEMINI_API_URL: &str = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

#[derive(Debug, Serialize)]
struct GeminiRequest {
    contents: Vec<Content>,
    #[serde(rename = "generationConfig")]
    generation_config: GenerationConfig,
}

#[derive(Debug, Serialize)]
struct Content {
    parts: Vec<Part>,
}

#[derive(Debug, Serialize)]
struct Part {
    text: String,
}

#[derive(Debug, Serialize)]
struct GenerationConfig {
    temperature: f32,
    #[serde(rename = "maxOutputTokens")]
    max_output_tokens: i32,
}

#[derive(Debug, Deserialize)]
struct GeminiResponse {
    candidates: Option<Vec<Candidate>>,
}

#[derive(Debug, Deserialize)]
struct Candidate {
    content: CandidateContent,
}

#[derive(Debug, Deserialize)]
struct CandidateContent {
    parts: Vec<CandidatePart>,
}

#[derive(Debug, Deserialize)]
struct CandidatePart {
    text: String,
}

#[derive(Debug, Deserialize)]
struct GeneratedQuestion {
    question: String,
    answer: String,
    solution_steps: Vec<GeneratedStep>,
    hints: Option<Vec<String>>,
}

#[derive(Debug, Deserialize)]
struct GeneratedStep {
    step: i32,
    description: String,
    expression: String,
}

pub struct GeminiClient {
    client: Client,
    api_key: String,
    prompt_loader: Arc<PromptLoader>,
}

impl GeminiClient {
    pub fn new(client: Client, api_key: &str, prompt_loader: Arc<PromptLoader>) -> Self {
        Self {
            client,
            api_key: api_key.to_string(),
            prompt_loader,
        }
    }

    pub async fn generate_question(
        &self,
        subject: &str,
        topic: &str,
        difficulty: i32,
    ) -> AppResult<Question> {
        // Load and render prompt from external file (with subject-specific override support)
        let mut vars = HashMap::new();
        vars.insert("subject", subject.to_string());
        vars.insert("topic", topic.to_string());
        vars.insert("difficulty", difficulty.to_string());

        let prompt = self.prompt_loader.load_and_render(
            "question_generation",
            Some(subject),
            &vars,
        );

        let request = GeminiRequest {
            contents: vec![Content {
                parts: vec![Part { text: prompt }],
            }],
            generation_config: GenerationConfig {
                temperature: 0.7,
                max_output_tokens: 2048,
            },
        };

        let url = format!("{}?key={}", GEMINI_API_URL, self.api_key);

        let response = self.client.post(&url).json(&request).send().await?;

        if !response.status().is_success() {
            let error_text = response.text().await.unwrap_or_default();
            return Err(AppError::ExternalService(format!(
                "Gemini API error: {}",
                error_text
            )));
        }

        let gemini_response: GeminiResponse = response.json().await?;

        let text = gemini_response
            .candidates
            .and_then(|c| c.into_iter().next())
            .map(|c| c.content.parts.into_iter().next())
            .flatten()
            .map(|p| p.text)
            .ok_or_else(|| AppError::ExternalService("No response from Gemini".to_string()))?;

        // Parse the JSON response
        let generated: GeneratedQuestion = serde_json::from_str(&text).map_err(|e| {
            AppError::ExternalService(format!("Failed to parse Gemini response: {} - {}", e, text))
        })?;

        let solution_steps: Vec<SolutionStep> = generated
            .solution_steps
            .into_iter()
            .map(|s| SolutionStep {
                step_number: s.step,
                description: s.description,
                expression_latex: s.expression,
            })
            .collect();

        Ok(Question::new(
            subject,
            topic,
            difficulty,
            &generated.question,
            &generated.answer,
            solution_steps,
            "generated",
        ))
    }
}

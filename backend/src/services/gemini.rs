use genai::chat::{ChatMessage, ChatOptions, ChatRequest, ContentPart};
use genai::Client;
use serde::Deserialize;
use std::collections::HashMap;
use std::sync::Arc;

use crate::error::{AppError, AppResult};
use crate::models::{Question, SolutionStep};
use crate::services::PromptLoader;

const MODEL: &str = "gemini-2.0-flash";

/// Fix LaTeX escapes in JSON - LLMs often output \frac instead of \\frac
fn fix_latex_escapes(json: &str) -> String {
    let mut result = json.to_string();
    let latex_commands = [
        "frac", "sqrt", "sum", "prod", "int", "lim", "infty", "partial",
        "alpha", "beta", "gamma", "delta", "epsilon", "theta", "lambda", "mu",
        "pi", "sigma", "omega", "phi", "psi", "rho", "tau", "nu", "xi", "zeta",
        "cdot", "times", "div", "pm", "mp", "leq", "geq", "neq", "approx",
        "in", "notin", "subset", "supset", "cup", "cap", "forall", "exists",
        "rightarrow", "leftarrow", "Rightarrow", "Leftarrow", "implies",
        "sin", "cos", "tan", "cot", "sec", "csc", "ln", "log", "exp",
        "mathbb", "mathbf", "mathrm", "text", "left", "right", "Big", "big",
        "begin", "end", "quad", "qquad", "hspace", "vspace", "newline",
        ",", ";", "!", ":", " ",  // LaTeX spacing commands
    ];

    for cmd in latex_commands {
        let single = format!(r"\{}", cmd);
        let double = format!(r"\\{}", cmd);
        result = result.replace(&double, &format!("__ESCAPED_{}__", cmd));
        result = result.replace(&single, &double);
        result = result.replace(&format!("__ESCAPED_{}__", cmd), &double);
    }

    result
}

/// Strip markdown code fences from text
fn strip_markdown_fences(text: &str) -> String {
    let text = text.trim();
    // Remove ```json\n or ```\n at start and ``` at end
    if text.starts_with("```") {
        let text = if text.starts_with("```json") {
            &text[7..]  // Skip "```json"
        } else {
            &text[3..]  // Skip "```"
        };
        let text = text.trim_start_matches('\n');
        let text = text.strip_suffix("```").unwrap_or(text);
        text.trim().to_string()
    } else {
        text.to_string()
    }
}

/// Extract JSON object from text that might contain extra content
fn extract_json(text: &str) -> Option<String> {
    let start = text.find('{')?;
    let mut depth = 0;
    let mut end = start;

    for (i, c) in text[start..].char_indices() {
        match c {
            '{' => depth += 1,
            '}' => {
                depth -= 1;
                if depth == 0 {
                    end = start + i + 1;
                    break;
                }
            }
            _ => {}
        }
    }

    if depth == 0 && end > start {
        Some(text[start..end].to_string())
    } else {
        None
    }
}

#[derive(Debug, Deserialize)]
struct GeneratedQuestion {
    question: String,
    answer: String,
    solution_steps: Vec<GeneratedStep>,
    #[allow(dead_code)]
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
    prompt_loader: Arc<PromptLoader>,
}

impl GeminiClient {
    pub fn new(_http_client: reqwest::Client, _api_key: &str, prompt_loader: Arc<PromptLoader>) -> Self {
        // genai::Client reads GEMINI_API_KEY from environment automatically
        Self {
            client: Client::default(),
            prompt_loader,
        }
    }

    pub async fn generate_question(
        &self,
        subject: &str,
        topic: &str,
        difficulty: i32,
    ) -> AppResult<Question> {
        let mut vars = HashMap::new();
        vars.insert("subject", subject.to_string());
        vars.insert("topic", topic.to_string());
        vars.insert("difficulty", difficulty.to_string());

        let prompt = self.prompt_loader.load_and_render(
            "question_generation",
            Some(subject),
            &vars,
        );

        let chat_req = ChatRequest::new(vec![
            ChatMessage::system(
                "You are a JSON API for generating IB Math exam questions. \
                 Return ONLY valid JSON. No markdown, no code fences, no explanations. \
                 Multi-part questions (a), (b), (c) are allowed and encouraged for authentic IB style."
            ),
            ChatMessage::user(prompt),
        ]);

        let options = ChatOptions::default()
            .with_temperature(0.4)
            .with_max_tokens(8192);

        let response = self.client
            .exec_chat(MODEL, chat_req, Some(&options))
            .await
            .map_err(|e| AppError::ExternalService(format!("Gemini API error: {}", e)))?;

        let text = response
            .content_text_as_str()
            .ok_or_else(|| AppError::ExternalService("No response from Gemini".to_string()))?;

        // Strip markdown fences and extract JSON
        let stripped = strip_markdown_fences(text);
        let json_text = extract_json(&stripped).unwrap_or(stripped);

        // Fix LaTeX escapes
        let fixed_json = fix_latex_escapes(&json_text);

        // Parse the JSON response
        let generated: GeneratedQuestion = serde_json::from_str(&fixed_json).map_err(|e| {
            AppError::ExternalService(format!(
                "Failed to parse Gemini response: {} - {}",
                e,
                &fixed_json[..fixed_json.len().min(200)]
            ))
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

    pub async fn ocr_image(&self, image_base64: &str) -> AppResult<String> {
        // Strip data URL prefix if present (e.g., "data:image/png;base64,")
        let base64_data = if let Some(pos) = image_base64.find(",") {
            &image_base64[pos + 1..]
        } else {
            image_base64
        };

        // Detect content type from data URL or default to PNG
        let content_type = if image_base64.starts_with("data:image/jpeg") {
            "image/jpeg"
        } else if image_base64.starts_with("data:image/webp") {
            "image/webp"
        } else {
            "image/png"
        };

        let chat_req = ChatRequest::new(vec![
            ChatMessage::system(
                "You are a LaTeX OCR system. Extract mathematical expressions from handwritten \
                 images and return them as valid LaTeX. Return ONLY the LaTeX code with no \
                 explanations, markdown formatting, or code fences. If there are multiple \
                 expressions, separate them with newlines."
            ),
            ChatMessage::user(vec![
                ContentPart::from_text("Extract the mathematical expression from this handwritten image as LaTeX:"),
                ContentPart::from_image_base64(content_type, base64_data),
            ]),
        ]);

        let options = ChatOptions::default()
            .with_temperature(0.1);

        let response = self.client
            .exec_chat(MODEL, chat_req, Some(&options))
            .await
            .map_err(|e| AppError::ExternalService(format!("Gemini OCR error: {}", e)))?;

        let latex = response
            .content_text_as_str()
            .ok_or_else(|| AppError::ExternalService("No OCR response from Gemini".to_string()))?
            .trim()
            .to_string();

        Ok(latex)
    }
}

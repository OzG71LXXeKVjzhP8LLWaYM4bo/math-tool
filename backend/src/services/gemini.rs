use genai::chat::{ChatMessage, ChatOptions, ChatRequest, ContentPart};
use genai::Client;
use serde::Deserialize;
use std::collections::HashMap;
use std::sync::Arc;

use crate::error::{AppError, AppResult};
use crate::models::{Question, SolutionStep};
use crate::services::PromptLoader;

const GRADING_MODEL: &str = "gemini-3-flash-preview";

const MODEL: &str = "gemini-3-flash-preview";

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

/// Extract JSON array from text that might contain extra content
fn extract_json_array(text: &str) -> Option<String> {
    let start = text.find('[')?;
    let mut depth = 0;
    let mut end = start;

    for (i, c) in text[start..].char_indices() {
        match c {
            '[' => depth += 1,
            ']' => {
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

#[derive(Debug, Deserialize)]
struct GradingResponse {
    is_correct: bool,
    #[allow(dead_code)]
    reasoning: Option<String>,
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
        paper_type: Option<&str>,
    ) -> AppResult<Question> {
        let mut vars = HashMap::new();
        vars.insert("subject", subject.to_string());
        vars.insert("topic", topic.to_string());
        vars.insert("difficulty", difficulty.to_string());
        vars.insert("paper_type", paper_type.unwrap_or("paper1").to_string());

        // Add paper-specific instructions
        let paper_instructions = match paper_type {
            Some("paper1") => "Paper 1 style: NO CALCULATOR. Use exact values only (fractions, surds, π, e). Focus on algebraic manipulation, factorization, simplification, and proofs. Include 'show that' steps. Penalize decimal approximations.",
            Some("paper2") => "Paper 2 style: CALCULATOR ALLOWED. Use real-world context (motion, growth, economics, optimization). Include numerical solving, graph interpretation, statistics. Ask for interpretation of results and model assumptions.",
            Some("paper3") => "Paper 3 style: HL Investigation. CALCULATOR ALLOWED. Create unfamiliar problem settings with new definitions. Require multi-topic integration and deep reasoning. Use 'explore', 'investigate', 'hence deduce' language. Focus on proof and mathematical discovery.",
            _ => "Paper 1 style: NO CALCULATOR. Use exact values only.",
        };
        vars.insert("paper_instructions", paper_instructions.to_string());

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

    /// Generate multiple questions in a single API call
    pub async fn generate_questions(
        &self,
        subject: &str,
        topic: &str,
        difficulty: i32,
        paper_type: Option<&str>,
        count: i32,
    ) -> AppResult<Vec<Question>> {
        let mut vars = HashMap::new();
        vars.insert("subject", subject.to_string());
        vars.insert("topic", topic.to_string());
        vars.insert("difficulty", difficulty.to_string());
        vars.insert("paper_type", paper_type.unwrap_or("paper1").to_string());
        vars.insert("count", count.to_string());

        // Add paper-specific instructions
        let paper_instructions = match paper_type {
            Some("paper1") => "Paper 1 style: NO CALCULATOR. Use exact values only (fractions, surds, π, e). Focus on algebraic manipulation, factorization, simplification, and proofs. Include 'show that' steps. Penalize decimal approximations.",
            Some("paper2") => "Paper 2 style: CALCULATOR ALLOWED. Use real-world context (motion, growth, economics, optimization). Include numerical solving, graph interpretation, statistics. Ask for interpretation of results and model assumptions.",
            Some("paper3") => "Paper 3 style: HL Investigation. CALCULATOR ALLOWED. Create unfamiliar problem settings with new definitions. Require multi-topic integration and deep reasoning. Use 'explore', 'investigate', 'hence deduce' language. Focus on proof and mathematical discovery.",
            _ => "Paper 1 style: NO CALCULATOR. Use exact values only.",
        };
        vars.insert("paper_instructions", paper_instructions.to_string());

        let prompt = self.prompt_loader.load_and_render(
            "question_generation",
            Some(subject),
            &vars,
        );

        let chat_req = ChatRequest::new(vec![
            ChatMessage::system(
                "You are a JSON API for generating IB Math exam questions. \
                 Return ONLY valid JSON array. No markdown, no code fences, no explanations. \
                 Each question should test a different aspect of the topic."
            ),
            ChatMessage::user(prompt),
        ]);

        let options = ChatOptions::default()
            .with_temperature(0.5)  // Slightly higher for variety
            .with_max_tokens(16384);  // More tokens for multiple questions

        let response = self.client
            .exec_chat(MODEL, chat_req, Some(&options))
            .await
            .map_err(|e| AppError::ExternalService(format!("Gemini API error: {}", e)))?;

        let text = response
            .content_text_as_str()
            .ok_or_else(|| AppError::ExternalService("No response from Gemini".to_string()))?;

        // Strip markdown fences and extract JSON array
        let stripped = strip_markdown_fences(text);
        let json_text = extract_json_array(&stripped).unwrap_or(stripped);

        // Fix LaTeX escapes
        let fixed_json = fix_latex_escapes(&json_text);

        // Parse the JSON array response
        let generated: Vec<GeneratedQuestion> = serde_json::from_str(&fixed_json).map_err(|e| {
            AppError::ExternalService(format!(
                "Failed to parse Gemini response: {} - {}",
                e,
                &fixed_json[..fixed_json.len().min(300)]
            ))
        })?;

        // Convert to Question objects
        let questions: Vec<Question> = generated
            .into_iter()
            .map(|g| {
                let solution_steps: Vec<SolutionStep> = g
                    .solution_steps
                    .into_iter()
                    .map(|s| SolutionStep {
                        step_number: s.step,
                        description: s.description,
                        expression_latex: s.expression,
                    })
                    .collect();

                Question::new(
                    subject,
                    topic,
                    difficulty,
                    &g.question,
                    &g.answer,
                    solution_steps,
                    "generated",
                )
            })
            .collect();

        Ok(questions)
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

    pub async fn grade_answer(
        &self,
        question_latex: &str,
        user_answer: &str,
        correct_answer: &str,
    ) -> AppResult<bool> {
        let prompt = format!(
            r#"You are grading a math answer. Determine if the student's answer is mathematically equivalent to the correct answer.

Question: {}

Student's answer: {}

Correct answer: {}

Consider:
- Different but equivalent forms (e.g., 1/2 = 0.5, x^2 - 1 = (x-1)(x+1))
- Simplified vs unsimplified forms
- Different notation for the same value
- Minor formatting differences in LaTeX

Return ONLY a JSON object with this format:
{{"is_correct": true/false, "reasoning": "brief explanation"}}

No markdown, no code fences, just the JSON object."#,
            question_latex, user_answer, correct_answer
        );

        let chat_req = ChatRequest::new(vec![
            ChatMessage::system(
                "You are a math grading assistant. Return only valid JSON with is_correct boolean and brief reasoning."
            ),
            ChatMessage::user(prompt),
        ]);

        let options = ChatOptions::default()
            .with_temperature(0.1);

        let response = self.client
            .exec_chat(GRADING_MODEL, chat_req, Some(&options))
            .await
            .map_err(|e| AppError::ExternalService(format!("Gemini grading error: {}", e)))?;

        let text = response
            .content_text_as_str()
            .ok_or_else(|| AppError::ExternalService("No grading response from Gemini".to_string()))?;

        // Strip markdown fences and extract JSON
        let stripped = strip_markdown_fences(text);
        let json_text = extract_json(&stripped).unwrap_or(stripped);

        // Parse the response
        let is_correct = match serde_json::from_str::<GradingResponse>(&json_text) {
            Ok(grading) => grading.is_correct,
            Err(_) => {
                // Fallback: try to find is_correct pattern in text
                let lower = json_text.to_lowercase();
                lower.contains("\"is_correct\": true") || lower.contains("\"is_correct\":true")
            }
        };

        Ok(is_correct)
    }
}

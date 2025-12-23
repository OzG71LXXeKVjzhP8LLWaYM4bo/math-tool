use reqwest::Client;
use serde::{Deserialize, Serialize};

use crate::error::{AppError, AppResult};

#[derive(Debug, Serialize)]
pub struct OcrRequest {
    pub image_base64: String,
}

#[derive(Debug, Deserialize)]
pub struct OcrResponse {
    pub success: bool,
    pub latex: Option<String>,
    pub confidence: f32,
    pub error: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct SolveRequest {
    pub expression_latex: String,
    pub subject: String,
    pub solve_for: Option<String>,
    pub show_steps: bool,
    pub operation: String,
}

#[derive(Debug, Deserialize)]
pub struct SolutionStepResponse {
    pub step_number: i32,
    pub description: String,
    pub expression_latex: String,
}

#[derive(Debug, Deserialize)]
pub struct SolveResponse {
    pub success: bool,
    pub answer_latex: String,
    pub steps: Vec<SolutionStepResponse>,
    pub error: Option<String>,
}

pub struct PythonClient {
    client: Client,
    base_url: String,
}

impl PythonClient {
    pub fn new(client: Client, base_url: &str) -> Self {
        Self {
            client,
            base_url: base_url.to_string(),
        }
    }

    pub async fn ocr(&self, image_base64: &str) -> AppResult<OcrResponse> {
        let request = OcrRequest {
            image_base64: image_base64.to_string(),
        };

        let response = self
            .client
            .post(format!("{}/pix2tex", self.base_url))
            .json(&request)
            .send()
            .await?;

        if !response.status().is_success() {
            return Err(AppError::ExternalService(format!(
                "OCR service returned {}",
                response.status()
            )));
        }

        let ocr_response: OcrResponse = response.json().await?;
        Ok(ocr_response)
    }

    pub async fn solve(
        &self,
        expression: &str,
        subject: &str,
        solve_for: Option<&str>,
        operation: &str,
    ) -> AppResult<SolveResponse> {
        let request = SolveRequest {
            expression_latex: expression.to_string(),
            subject: subject.to_string(),
            solve_for: solve_for.map(|s| s.to_string()),
            show_steps: true,
            operation: operation.to_string(),
        };

        let response = self
            .client
            .post(format!("{}/solve", self.base_url))
            .json(&request)
            .send()
            .await?;

        if !response.status().is_success() {
            return Err(AppError::ExternalService(format!(
                "Solver service returned {}",
                response.status()
            )));
        }

        let solve_response: SolveResponse = response.json().await?;
        Ok(solve_response)
    }
}

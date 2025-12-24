use axum::{extract::State, Json};
use serde::{Deserialize, Serialize};

use crate::error::{AppError, AppResult};
use crate::services::GeminiClient;
use crate::AppState;

#[derive(Debug, Deserialize)]
pub struct OcrRequest {
    pub image_base64: String,
}

#[derive(Debug, Serialize)]
pub struct OcrResponse {
    pub success: bool,
    pub latex: Option<String>,
    pub confidence: f32,
    pub error: Option<String>,
}

pub async fn ocr_image(
    State(state): State<AppState>,
    Json(request): Json<OcrRequest>,
) -> AppResult<Json<OcrResponse>> {
    // Check if Gemini API key is configured
    if state.config.gemini_api_key.is_empty() {
        return Err(AppError::ExternalService(
            "Gemini API key not configured for OCR".to_string(),
        ));
    }

    let client = GeminiClient::new(
        state.http_client.clone(),
        &state.config.gemini_api_key,
        state.prompt_loader.clone(),
    );

    let result = client.ocr_image(&request.image_base64).await?;

    Ok(Json(OcrResponse {
        success: result.success,
        latex: result.latex,
        confidence: if result.success { 0.95 } else { 0.0 }, // Gemini doesn't provide confidence
        error: result.error,
    }))
}

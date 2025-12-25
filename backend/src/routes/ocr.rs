use axum::{extract::State, Json};
use serde::{Deserialize, Serialize};

use crate::error::AppResult;
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
        return Ok(Json(OcrResponse {
            success: false,
            latex: None,
            confidence: 0.0,
            error: Some("OCR service not configured".to_string()),
        }));
    }

    let client = GeminiClient::new(
        state.http_client.clone(),
        &state.config.gemini_api_key,
        state.prompt_loader.clone(),
    );

    match client.ocr_image(&request.image_base64).await {
        Ok(latex) => Ok(Json(OcrResponse {
            success: true,
            latex: Some(latex),
            confidence: 0.95, // Gemini doesn't provide confidence, using high default
            error: None,
        })),
        Err(e) => {
            tracing::error!("OCR failed: {}", e);
            Ok(Json(OcrResponse {
                success: false,
                latex: None,
                confidence: 0.0,
                error: Some(e.to_string()),
            }))
        }
    }
}

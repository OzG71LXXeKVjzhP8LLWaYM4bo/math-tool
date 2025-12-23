use axum::{extract::State, Json};
use serde::{Deserialize, Serialize};

use crate::error::AppResult;
use crate::services::PythonClient;
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
    let client = PythonClient::new(state.http_client, &state.config.python_service_url);

    let response = client.ocr(&request.image_base64).await?;

    Ok(Json(OcrResponse {
        success: response.success,
        latex: response.latex,
        confidence: response.confidence,
        error: response.error,
    }))
}

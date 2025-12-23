use axum::{extract::State, Json};
use serde::{Deserialize, Serialize};

use crate::error::AppResult;
use crate::services::PythonClient;
use crate::AppState;

#[derive(Debug, Deserialize)]
pub struct SolveRequest {
    pub expression_latex: String,
    pub subject: Option<String>,
    pub solve_for: Option<String>,
    pub operation: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct SolutionStep {
    pub step_number: i32,
    pub description: String,
    pub expression_latex: String,
}

#[derive(Debug, Serialize)]
pub struct SolveResponse {
    pub success: bool,
    pub answer_latex: String,
    pub steps: Vec<SolutionStep>,
    pub error: Option<String>,
}

pub async fn solve_expression(
    State(state): State<AppState>,
    Json(request): Json<SolveRequest>,
) -> AppResult<Json<SolveResponse>> {
    let client = PythonClient::new(state.http_client, &state.config.python_service_url);

    let response = client
        .solve(
            &request.expression_latex,
            request.subject.as_deref().unwrap_or("math"),
            request.solve_for.as_deref(),
            request.operation.as_deref().unwrap_or("solve"),
        )
        .await?;

    let steps = response
        .steps
        .into_iter()
        .map(|s| SolutionStep {
            step_number: s.step_number,
            description: s.description,
            expression_latex: s.expression_latex,
        })
        .collect();

    Ok(Json(SolveResponse {
        success: response.success,
        answer_latex: response.answer_latex,
        steps,
        error: response.error,
    }))
}

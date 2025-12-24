use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Question {
    pub id: Uuid,
    pub subject: String,
    pub topic: String,
    pub subtopic: Option<String>,
    pub difficulty: i32,

    // Multi-part linking
    pub parent_id: Option<Uuid>,
    pub part_label: Option<String>,
    pub part_order: i32,

    pub question_latex: String,
    pub answer_latex: String,
    pub solution_steps: serde_json::Value,
    pub hints: Option<serde_json::Value>,
    pub source: String,
    pub created_at: Option<DateTime<Utc>>,
}

impl Question {
    pub fn new(
        subject: &str,
        topic: &str,
        difficulty: i32,
        question_latex: &str,
        answer_latex: &str,
        solution_steps: Vec<SolutionStep>,
        source: &str,
    ) -> Self {
        Self {
            id: Uuid::new_v4(),
            subject: subject.to_string(),
            topic: topic.to_string(),
            subtopic: None,
            difficulty,
            parent_id: None,
            part_label: None,
            part_order: 0,
            question_latex: question_latex.to_string(),
            answer_latex: answer_latex.to_string(),
            solution_steps: serde_json::to_value(&solution_steps).unwrap_or_default(),
            hints: None,
            source: source.to_string(),
            created_at: Some(Utc::now()),
        }
    }

    pub fn is_multi_part(&self) -> bool {
        self.parent_id.is_some()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SolutionStep {
    pub step_number: i32,
    pub description: String,
    pub expression_latex: String,
}

#[derive(Debug, Deserialize)]
pub struct GenerateQuestionRequest {
    pub subject: String,
    pub topic: String,
    pub difficulty: Option<i32>,
    pub count: Option<i32>,
}

#[derive(Debug, Serialize)]
pub struct GenerateQuestionResponse {
    pub questions: Vec<Question>,
}

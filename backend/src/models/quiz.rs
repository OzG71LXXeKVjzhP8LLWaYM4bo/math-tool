use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Quiz {
    pub id: Uuid,
    pub subject: String,
    pub topic: String,
    pub question_ids: Vec<Uuid>,
    pub current_index: i32,
    pub started_at: Option<DateTime<Utc>>,
    pub completed_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct QuizAnswer {
    pub id: Uuid,
    pub quiz_id: Uuid,
    pub question_id: Uuid,
    pub answer_latex: String,
    pub is_correct: bool,
    pub time_taken: i32,
    pub answered_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Deserialize)]
pub struct QuizNextRequest {
    pub subject: String,
    pub topic: String,
    pub quiz_id: Option<Uuid>,
}

#[derive(Debug, Serialize)]
pub struct QuizNextResponse {
    pub question: super::Question,
    pub parent_question: Option<super::Question>,  // For multi-part questions
    pub quiz_id: Uuid,
    pub question_number: i32,
    pub total_questions: i32,
}

#[derive(Debug, Deserialize)]
pub struct QuizSubmitRequest {
    pub quiz_id: Uuid,
    pub question_id: Uuid,
    pub answer_latex: String,
    pub time_taken: i32,
}

#[derive(Debug, Serialize)]
pub struct QuizSubmitResponse {
    pub is_correct: bool,
    pub correct_answer: String,
    pub solution: serde_json::Value,
    pub next_difficulty: i32,
}

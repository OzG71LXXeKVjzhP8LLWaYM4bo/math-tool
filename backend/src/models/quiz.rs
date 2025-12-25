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
    // New fields for quiz/exam mode
    #[sqlx(default)]
    pub mode: Option<String>,           // 'quiz' or 'exam'
    #[sqlx(default)]
    pub paper_type: Option<String>,     // 'paper1', 'paper2', 'paper3'
    #[sqlx(default)]
    pub question_count: Option<i32>,
    #[sqlx(default)]
    pub time_limit: Option<i32>,        // seconds
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
    // New fields for quiz/exam mode
    pub mode: Option<String>,
    pub paper_type: Option<String>,
    pub question_count: Option<i32>,
}

#[derive(Debug, Serialize)]
pub struct QuizNextResponse {
    pub question: super::Question,
    pub parent_question: Option<super::Question>,  // For multi-part questions
    pub quiz_id: Uuid,
    pub question_number: i32,
    pub total_questions: i32,
    // New fields for quiz/exam mode
    pub mode: Option<String>,
    pub paper_type: Option<String>,
    pub time_limit: Option<i32>,
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

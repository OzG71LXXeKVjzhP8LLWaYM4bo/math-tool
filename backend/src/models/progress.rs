use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Progress {
    pub id: Uuid,
    pub subject: String,
    pub topic: String,
    pub total_attempts: i32,
    pub correct_answers: i32,
    pub average_difficulty: f32,
    pub current_streak: i32,
    pub mastery_level: i32,
    pub last_activity: Option<DateTime<Utc>>,
}

#[derive(Debug, Deserialize)]
pub struct ProgressQuery {
    pub subject: Option<String>,
    pub topic: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct ProgressResponse {
    pub progress: Vec<Progress>,
}

#[derive(Debug, Serialize)]
pub struct TopicProgress {
    pub subject: String,
    pub topic: String,
    pub accuracy: f32,
    pub mastery_level: i32,
    pub streak: i32,
}

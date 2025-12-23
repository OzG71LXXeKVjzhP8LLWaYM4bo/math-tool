use axum::{
    extract::{Query, State},
    Json,
};

use crate::db::get_progress as db_get_progress;
use crate::error::AppResult;
use crate::models::{ProgressQuery, ProgressResponse, TopicProgress};
use crate::AppState;

pub async fn get_progress(
    State(state): State<AppState>,
    Query(query): Query<ProgressQuery>,
) -> AppResult<Json<ProgressResponse>> {
    let progress = db_get_progress(
        &state.db.pool,
        query.subject.as_deref(),
        query.topic.as_deref(),
    )
    .await?;

    Ok(Json(ProgressResponse { progress }))
}

pub async fn get_topic_progress(
    State(state): State<AppState>,
) -> AppResult<Json<Vec<TopicProgress>>> {
    let all_progress = db_get_progress(&state.db.pool, None, None).await?;

    let topic_progress: Vec<TopicProgress> = all_progress
        .into_iter()
        .map(|p| {
            let accuracy = if p.total_attempts > 0 {
                p.correct_answers as f32 / p.total_attempts as f32
            } else {
                0.0
            };

            TopicProgress {
                subject: p.subject,
                topic: p.topic,
                accuracy,
                mastery_level: p.mastery_level,
                streak: p.current_streak,
            }
        })
        .collect();

    Ok(Json(topic_progress))
}

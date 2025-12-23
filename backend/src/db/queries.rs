use sqlx::PgPool;
use uuid::Uuid;

use crate::models::{Progress, Question, QuizAnswer, QuizSession};

// Question queries
pub async fn insert_question(pool: &PgPool, question: &Question) -> Result<Question, sqlx::Error> {
    sqlx::query_as::<_, Question>(
        r#"
        INSERT INTO questions (id, subject, topic, subtopic, difficulty, question_latex, answer_latex, solution_steps, hints, source)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
        "#,
    )
    .bind(&question.id)
    .bind(&question.subject)
    .bind(&question.topic)
    .bind(&question.subtopic)
    .bind(question.difficulty)
    .bind(&question.question_latex)
    .bind(&question.answer_latex)
    .bind(&question.solution_steps)
    .bind(&question.hints)
    .bind(&question.source)
    .fetch_one(pool)
    .await
}

pub async fn get_question_by_id(pool: &PgPool, id: Uuid) -> Result<Option<Question>, sqlx::Error> {
    sqlx::query_as::<_, Question>("SELECT * FROM questions WHERE id = $1")
        .bind(id)
        .fetch_optional(pool)
        .await
}

pub async fn get_questions_by_topic(
    pool: &PgPool,
    subject: &str,
    topic: &str,
    difficulty: Option<i32>,
    limit: i64,
) -> Result<Vec<Question>, sqlx::Error> {
    if let Some(diff) = difficulty {
        sqlx::query_as::<_, Question>(
            r#"
            SELECT * FROM questions
            WHERE subject = $1 AND topic = $2 AND difficulty = $3
            ORDER BY RANDOM()
            LIMIT $4
            "#,
        )
        .bind(subject)
        .bind(topic)
        .bind(diff)
        .bind(limit)
        .fetch_all(pool)
        .await
    } else {
        sqlx::query_as::<_, Question>(
            r#"
            SELECT * FROM questions
            WHERE subject = $1 AND topic = $2
            ORDER BY RANDOM()
            LIMIT $3
            "#,
        )
        .bind(subject)
        .bind(topic)
        .bind(limit)
        .fetch_all(pool)
        .await
    }
}

// Quiz session queries
pub async fn create_quiz_session(
    pool: &PgPool,
    subject: &str,
    topic: &str,
) -> Result<QuizSession, sqlx::Error> {
    sqlx::query_as::<_, QuizSession>(
        r#"
        INSERT INTO quiz_sessions (subject, topic)
        VALUES ($1, $2)
        RETURNING *
        "#,
    )
    .bind(subject)
    .bind(topic)
    .fetch_one(pool)
    .await
}

pub async fn get_quiz_session(pool: &PgPool, id: Uuid) -> Result<Option<QuizSession>, sqlx::Error> {
    sqlx::query_as::<_, QuizSession>("SELECT * FROM quiz_sessions WHERE id = $1")
        .bind(id)
        .fetch_optional(pool)
        .await
}

pub async fn update_quiz_session_index(
    pool: &PgPool,
    id: Uuid,
    index: i32,
) -> Result<(), sqlx::Error> {
    sqlx::query("UPDATE quiz_sessions SET current_index = $1 WHERE id = $2")
        .bind(index)
        .bind(id)
        .execute(pool)
        .await?;
    Ok(())
}

// Quiz answer queries
pub async fn insert_quiz_answer(
    pool: &PgPool,
    answer: &QuizAnswer,
) -> Result<QuizAnswer, sqlx::Error> {
    sqlx::query_as::<_, QuizAnswer>(
        r#"
        INSERT INTO quiz_answers (session_id, question_id, answer_latex, is_correct, time_taken)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
        "#,
    )
    .bind(&answer.session_id)
    .bind(&answer.question_id)
    .bind(&answer.answer_latex)
    .bind(answer.is_correct)
    .bind(answer.time_taken)
    .fetch_one(pool)
    .await
}

pub async fn get_recent_answers(
    pool: &PgPool,
    subject: &str,
    topic: &str,
    limit: i64,
) -> Result<Vec<QuizAnswer>, sqlx::Error> {
    sqlx::query_as::<_, QuizAnswer>(
        r#"
        SELECT qa.* FROM quiz_answers qa
        JOIN quiz_sessions qs ON qa.session_id = qs.id
        WHERE qs.subject = $1 AND qs.topic = $2
        ORDER BY qa.answered_at DESC
        LIMIT $3
        "#,
    )
    .bind(subject)
    .bind(topic)
    .bind(limit)
    .fetch_all(pool)
    .await
}

// Progress queries
pub async fn get_progress(
    pool: &PgPool,
    subject: Option<&str>,
    topic: Option<&str>,
) -> Result<Vec<Progress>, sqlx::Error> {
    match (subject, topic) {
        (Some(s), Some(t)) => {
            sqlx::query_as::<_, Progress>(
                "SELECT * FROM progress WHERE subject = $1 AND topic = $2",
            )
            .bind(s)
            .bind(t)
            .fetch_all(pool)
            .await
        }
        (Some(s), None) => {
            sqlx::query_as::<_, Progress>("SELECT * FROM progress WHERE subject = $1")
                .bind(s)
                .fetch_all(pool)
                .await
        }
        _ => {
            sqlx::query_as::<_, Progress>("SELECT * FROM progress")
                .fetch_all(pool)
                .await
        }
    }
}

pub async fn upsert_progress(
    pool: &PgPool,
    subject: &str,
    topic: &str,
    is_correct: bool,
    difficulty: i32,
) -> Result<Progress, sqlx::Error> {
    sqlx::query_as::<_, Progress>(
        r#"
        INSERT INTO progress (subject, topic, total_attempts, correct_answers, average_difficulty, current_streak, last_activity)
        VALUES ($1, $2, 1, $3, $4, $5, NOW())
        ON CONFLICT (subject, topic) DO UPDATE SET
            total_attempts = progress.total_attempts + 1,
            correct_answers = progress.correct_answers + $3,
            average_difficulty = (progress.average_difficulty * progress.total_attempts + $4) / (progress.total_attempts + 1),
            current_streak = CASE WHEN $6 THEN progress.current_streak + 1 ELSE 0 END,
            mastery_level = LEAST(100, progress.mastery_level + CASE WHEN $6 THEN 2 ELSE -1 END),
            last_activity = NOW()
        RETURNING *
        "#,
    )
    .bind(subject)
    .bind(topic)
    .bind(if is_correct { 1 } else { 0 })
    .bind(difficulty as f32)
    .bind(if is_correct { 1 } else { 0 })
    .bind(is_correct)
    .fetch_one(pool)
    .await
}

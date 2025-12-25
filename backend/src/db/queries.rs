use sqlx::PgPool;
use uuid::Uuid;

use crate::models::{Progress, Question, Quiz, QuizAnswer};

// Question queries
pub async fn insert_question(pool: &PgPool, question: &Question) -> Result<Question, sqlx::Error> {
    sqlx::query_as::<_, Question>(
        r#"
        INSERT INTO questions (id, subject, topic, subtopic, difficulty, parent_id, part_label, part_order, question_latex, answer_latex, solution_steps, hints, source)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
        "#,
    )
    .bind(&question.id)
    .bind(&question.subject)
    .bind(&question.topic)
    .bind(&question.subtopic)
    .bind(question.difficulty)
    .bind(&question.parent_id)
    .bind(&question.part_label)
    .bind(question.part_order)
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

pub async fn get_question_parts(pool: &PgPool, parent_id: Uuid) -> Result<Vec<Question>, sqlx::Error> {
    sqlx::query_as::<_, Question>(
        r#"
        SELECT * FROM questions
        WHERE parent_id = $1
        ORDER BY part_order
        "#,
    )
    .bind(parent_id)
    .fetch_all(pool)
    .await
}

pub async fn get_questions_by_topic(
    pool: &PgPool,
    subject: &str,
    topic: &str,
    difficulty: Option<i32>,
    limit: i64,
) -> Result<Vec<Question>, sqlx::Error> {
    // Only get standalone questions (no parts)
    if let Some(diff) = difficulty {
        sqlx::query_as::<_, Question>(
            r#"
            SELECT * FROM questions
            WHERE subject = $1 AND topic = $2 AND difficulty = $3 AND parent_id IS NULL
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
            WHERE subject = $1 AND topic = $2 AND parent_id IS NULL
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

// Quiz queries
pub async fn create_quiz(
    pool: &PgPool,
    subject: &str,
    topic: &str,
    question_ids: &[Uuid],
    mode: Option<&str>,
    paper_type: Option<&str>,
    question_count: Option<i32>,
    time_limit: Option<i32>,
) -> Result<Quiz, sqlx::Error> {
    sqlx::query_as::<_, Quiz>(
        r#"
        INSERT INTO quizzes (subject, topic, question_ids, mode, paper_type, question_count, time_limit)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
        "#,
    )
    .bind(subject)
    .bind(topic)
    .bind(question_ids)
    .bind(mode)
    .bind(paper_type)
    .bind(question_count)
    .bind(time_limit)
    .fetch_one(pool)
    .await
}

pub async fn get_quiz(pool: &PgPool, id: Uuid) -> Result<Option<Quiz>, sqlx::Error> {
    sqlx::query_as::<_, Quiz>("SELECT * FROM quizzes WHERE id = $1")
        .bind(id)
        .fetch_optional(pool)
        .await
}

pub async fn update_quiz_index(
    pool: &PgPool,
    id: Uuid,
    index: i32,
) -> Result<(), sqlx::Error> {
    sqlx::query("UPDATE quizzes SET current_index = $1 WHERE id = $2")
        .bind(index)
        .bind(id)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn add_question_to_quiz(
    pool: &PgPool,
    quiz_id: Uuid,
    question_id: Uuid,
) -> Result<(), sqlx::Error> {
    sqlx::query("UPDATE quizzes SET question_ids = array_append(question_ids, $1) WHERE id = $2")
        .bind(question_id)
        .bind(quiz_id)
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
        INSERT INTO quiz_answers (quiz_id, question_id, answer_latex, is_correct, time_taken)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (quiz_id, question_id) DO UPDATE SET
            answer_latex = EXCLUDED.answer_latex,
            is_correct = EXCLUDED.is_correct,
            time_taken = EXCLUDED.time_taken,
            answered_at = NOW()
        RETURNING *
        "#,
    )
    .bind(&answer.quiz_id)
    .bind(&answer.question_id)
    .bind(&answer.answer_latex)
    .bind(answer.is_correct)
    .bind(answer.time_taken)
    .fetch_one(pool)
    .await
}

// Quiz history queries
#[derive(Debug, Clone, serde::Serialize, sqlx::FromRow)]
pub struct QuizWithStats {
    pub id: Uuid,
    pub subject: String,
    pub topic: String,
    pub total_questions: i64,
    pub correct_answers: i64,
    pub started_at: Option<chrono::DateTime<chrono::Utc>>,
    pub mode: Option<String>,
    pub paper_type: Option<String>,
}

pub async fn get_quiz_history(
    pool: &PgPool,
    limit: i64,
) -> Result<Vec<QuizWithStats>, sqlx::Error> {
    sqlx::query_as::<_, QuizWithStats>(
        r#"
        SELECT
            q.id,
            q.subject,
            q.topic,
            COALESCE(array_length(q.question_ids, 1), 0)::bigint as total_questions,
            COALESCE(SUM(CASE WHEN qa.is_correct THEN 1 ELSE 0 END), 0)::bigint as correct_answers,
            q.started_at,
            q.mode,
            q.paper_type
        FROM quizzes q
        LEFT JOIN quiz_answers qa ON qa.quiz_id = q.id
        GROUP BY q.id, q.subject, q.topic, q.question_ids, q.started_at, q.mode, q.paper_type
        HAVING COALESCE(array_length(q.question_ids, 1), 0) > 0
        ORDER BY q.started_at DESC
        LIMIT $1
        "#,
    )
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

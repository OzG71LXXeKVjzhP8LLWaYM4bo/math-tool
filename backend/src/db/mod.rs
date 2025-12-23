mod queries;

pub use queries::*;

use anyhow::Result;
use sqlx::{postgres::PgPoolOptions, PgPool};

#[derive(Clone)]
pub struct Database {
    pub pool: PgPool,
}

impl Database {
    pub async fn new(database_url: &str) -> Result<Self> {
        let pool = PgPoolOptions::new()
            .max_connections(5)
            .connect(database_url)
            .await?;

        Ok(Self { pool })
    }

    pub async fn run_migrations(&self) -> Result<()> {
        // Create tables if they don't exist
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS questions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                subject TEXT NOT NULL,
                topic TEXT NOT NULL,
                subtopic TEXT,
                difficulty INTEGER NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
                question_latex TEXT NOT NULL,
                answer_latex TEXT NOT NULL,
                solution_steps JSONB NOT NULL DEFAULT '[]',
                hints JSONB DEFAULT '[]',
                source TEXT NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
            "#,
        )
        .execute(&self.pool)
        .await?;

        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS quiz_sessions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                subject TEXT NOT NULL,
                topic TEXT NOT NULL,
                current_index INTEGER DEFAULT 0,
                started_at TIMESTAMPTZ DEFAULT NOW(),
                completed_at TIMESTAMPTZ
            )
            "#,
        )
        .execute(&self.pool)
        .await?;

        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS quiz_answers (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                session_id UUID REFERENCES quiz_sessions(id) ON DELETE CASCADE,
                question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
                answer_latex TEXT NOT NULL,
                is_correct BOOLEAN NOT NULL,
                time_taken INTEGER NOT NULL,
                answered_at TIMESTAMPTZ DEFAULT NOW()
            )
            "#,
        )
        .execute(&self.pool)
        .await?;

        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS progress (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                subject TEXT NOT NULL,
                topic TEXT NOT NULL,
                total_attempts INTEGER DEFAULT 0,
                correct_answers INTEGER DEFAULT 0,
                average_difficulty REAL DEFAULT 1.0,
                current_streak INTEGER DEFAULT 0,
                mastery_level INTEGER DEFAULT 0,
                last_activity TIMESTAMPTZ,
                UNIQUE(subject, topic)
            )
            "#,
        )
        .execute(&self.pool)
        .await?;

        tracing::info!("Database migrations completed");
        Ok(())
    }
}

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
        // Drop old tables if they exist (clean migration)
        sqlx::query("DROP TABLE IF EXISTS quiz_answers CASCADE")
            .execute(&self.pool)
            .await?;
        sqlx::query("DROP TABLE IF EXISTS quiz_sessions CASCADE")
            .execute(&self.pool)
            .await?;
        sqlx::query("DROP TABLE IF EXISTS quizzes CASCADE")
            .execute(&self.pool)
            .await?;
        sqlx::query("DROP TABLE IF EXISTS questions CASCADE")
            .execute(&self.pool)
            .await?;

        // Create questions table with multi-part support
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS questions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

                -- Classification
                subject TEXT NOT NULL,
                topic TEXT NOT NULL,
                subtopic TEXT,
                difficulty INTEGER NOT NULL CHECK (difficulty BETWEEN 1 AND 5),

                -- Multi-part linking
                parent_id UUID REFERENCES questions(id) ON DELETE CASCADE,
                part_label TEXT,
                part_order INTEGER DEFAULT 0,

                -- Content
                question_latex TEXT NOT NULL,
                answer_latex TEXT NOT NULL,
                solution_steps JSONB NOT NULL DEFAULT '[]',
                hints JSONB DEFAULT '[]',

                -- Metadata
                source TEXT NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
            "#,
        )
        .execute(&self.pool)
        .await?;

        // Create quizzes table with question_ids array
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS quizzes (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

                -- Quiz info
                subject TEXT NOT NULL,
                topic TEXT NOT NULL,
                name TEXT,                  -- Display-friendly name

                -- Questions (ordered array)
                question_ids UUID[] NOT NULL DEFAULT '{}',

                -- Progress
                current_index INTEGER DEFAULT 0,

                -- Quiz/Exam mode settings
                mode TEXT,                  -- 'quiz' or 'exam'
                paper_type TEXT,            -- 'paper1', 'paper2', 'paper3'
                question_count INTEGER,     -- target number of questions
                time_limit INTEGER,         -- seconds (for exam mode)

                -- Timestamps
                started_at TIMESTAMPTZ DEFAULT NOW(),
                completed_at TIMESTAMPTZ
            )
            "#,
        )
        .execute(&self.pool)
        .await?;

        // Create quiz_answers table
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS quiz_answers (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
                question_id UUID REFERENCES questions(id) ON DELETE CASCADE,

                answer_latex TEXT NOT NULL,
                is_correct BOOLEAN NOT NULL,
                time_taken INTEGER NOT NULL,
                answered_at TIMESTAMPTZ DEFAULT NOW(),

                UNIQUE(quiz_id, question_id)
            )
            "#,
        )
        .execute(&self.pool)
        .await?;

        // Create progress table
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

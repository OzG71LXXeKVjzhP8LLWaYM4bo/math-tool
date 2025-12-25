use axum::{
    extract::{Path, Query, State},
    Json,
};
use serde::Deserialize;
use uuid::Uuid;

use crate::db::{
    add_question_to_quiz, create_quiz, get_question_by_id, get_quiz,
    insert_question, insert_quiz_answer, update_quiz_index, upsert_progress,
    QuizWithStats,
};
use crate::error::{AppError, AppResult};
use crate::models::{
    Question, QuizAnswer, QuizNextRequest, QuizNextResponse,
    QuizSubmitRequest, QuizSubmitResponse,
};
use crate::services::GeminiClient;
use crate::AppState;

// Fixed exam-level difficulty for all questions
const EXAM_DIFFICULTY: i32 = 4;

// Time per question in seconds based on paper type
fn get_time_per_question(paper_type: Option<&str>) -> i32 {
    match paper_type {
        Some("paper3") => 25 * 60, // 25 minutes for Paper 3 (investigation)
        _ => 12 * 60,              // 12 minutes for Paper 1 and Paper 2
    }
}

/// Request to create a new quiz
#[derive(Debug, Deserialize)]
pub struct CreateQuizRequest {
    pub subject: String,
    pub topic: String,
    pub mode: Option<String>,
    pub paper_type: Option<String>,
    pub question_count: Option<i32>,
}

/// Response for quiz creation and retrieval
#[derive(Debug, serde::Serialize)]
pub struct QuizResponse {
    pub id: Uuid,
    pub subject: String,
    pub topic: String,
    pub current_index: i32,
    pub question_count: i32,
    pub mode: Option<String>,
    pub paper_type: Option<String>,
    pub time_limit: Option<i32>,
    pub questions: Vec<QuestionWithAnswer>,
}

#[derive(Debug, serde::Serialize)]
pub struct QuestionWithAnswer {
    pub question: Question,
    pub user_answer: Option<String>,
    pub is_correct: Option<bool>,
}

/// POST /api/quiz - Create a new quiz and generate first question
pub async fn create_new_quiz(
    State(state): State<AppState>,
    Json(request): Json<CreateQuizRequest>,
) -> AppResult<Json<QuizResponse>> {
    let question_count = request.question_count.unwrap_or(5);

    // Calculate time limit for exam mode
    let time_limit = if request.mode.as_deref() == Some("exam") {
        let time_per_q = get_time_per_question(request.paper_type.as_deref());
        Some(question_count * time_per_q)
    } else {
        None
    };

    // Create a new quiz
    let quiz = create_quiz(
        &state.db.pool,
        &request.subject,
        &request.topic,
        &[],
        request.mode.as_deref(),
        request.paper_type.as_deref(),
        Some(question_count),
        time_limit,
    )
    .await?;

    // Generate the first question
    let first_question = if !state.config.gemini_api_key.is_empty() {
        let client = GeminiClient::new(
            state.http_client.clone(),
            &state.config.gemini_api_key,
            state.prompt_loader.clone(),
        );
        client
            .generate_question(
                &request.subject,
                &request.topic,
                EXAM_DIFFICULTY,
                request.paper_type.as_deref(),
            )
            .await?
    } else {
        return Err(AppError::Internal(
            "No Gemini API key configured".to_string(),
        ));
    };

    // Save and add to quiz
    let saved_question = insert_question(&state.db.pool, &first_question).await?;
    add_question_to_quiz(&state.db.pool, quiz.id, saved_question.id).await?;

    Ok(Json(QuizResponse {
        id: quiz.id,
        subject: quiz.subject,
        topic: quiz.topic,
        current_index: 0,
        question_count,
        mode: quiz.mode,
        paper_type: quiz.paper_type,
        time_limit,
        questions: vec![QuestionWithAnswer {
            question: saved_question,
            user_answer: None,
            is_correct: None,
        }],
    }))
}

/// GET /api/quiz/:id - Get an existing quiz with all its questions and answers
pub async fn get_existing_quiz(
    State(state): State<AppState>,
    Path(quiz_id): Path<Uuid>,
) -> AppResult<Json<QuizResponse>> {
    // Get the quiz
    let quiz = get_quiz(&state.db.pool, quiz_id)
        .await?
        .ok_or_else(|| AppError::NotFound("Quiz not found".to_string()))?;

    // Get all questions with their answers
    let mut questions_with_answers = Vec::new();

    for question_id in &quiz.question_ids {
        let question = get_question_by_id(&state.db.pool, *question_id)
            .await?
            .ok_or_else(|| AppError::NotFound("Question not found".to_string()))?;

        // Get user's answer if exists
        let answer = get_quiz_answer(&state.db.pool, quiz_id, *question_id).await?;

        questions_with_answers.push(QuestionWithAnswer {
            question,
            user_answer: answer.as_ref().map(|a| a.answer_latex.clone()),
            is_correct: answer.as_ref().map(|a| a.is_correct),
        });
    }

    Ok(Json(QuizResponse {
        id: quiz.id,
        subject: quiz.subject,
        topic: quiz.topic,
        current_index: quiz.current_index,
        question_count: quiz.question_count.unwrap_or(10),
        mode: quiz.mode,
        paper_type: quiz.paper_type,
        time_limit: quiz.time_limit,
        questions: questions_with_answers,
    }))
}

/// GET /api/quiz/next - Generate and return the next question for a quiz
pub async fn get_next_question(
    State(state): State<AppState>,
    Query(request): Query<QuizNextRequest>,
) -> AppResult<Json<QuizNextResponse>> {
    let quiz_id = request
        .quiz_id
        .ok_or_else(|| AppError::BadRequest("quiz_id is required".to_string()))?;

    // Get existing quiz
    let quiz = get_quiz(&state.db.pool, quiz_id)
        .await?
        .ok_or_else(|| AppError::NotFound("Quiz not found".to_string()))?;

    let current_index = quiz.current_index as usize;
    let paper_type = quiz.paper_type.clone();

    // Check if we have a question at this index already
    let question = if current_index < quiz.question_ids.len() {
        // Return existing question
        let question_id = quiz.question_ids[current_index];
        get_question_by_id(&state.db.pool, question_id)
            .await?
            .ok_or_else(|| AppError::NotFound("Question not found".to_string()))?
    } else {
        // Generate a new question
        let generated_question = if !state.config.gemini_api_key.is_empty() {
            let client = GeminiClient::new(
                state.http_client.clone(),
                &state.config.gemini_api_key,
                state.prompt_loader.clone(),
            );
            client
                .generate_question(
                    &quiz.subject,
                    &quiz.topic,
                    EXAM_DIFFICULTY,
                    paper_type.as_deref(),
                )
                .await?
        } else {
            return Err(AppError::Internal(
                "No Gemini API key configured".to_string(),
            ));
        };

        // Save and add to quiz
        let saved_question = insert_question(&state.db.pool, &generated_question).await?;
        add_question_to_quiz(&state.db.pool, quiz.id, saved_question.id).await?;
        saved_question
    };

    // Get parent question if this is a part
    let parent_question = if let Some(parent_id) = question.parent_id {
        get_question_by_id(&state.db.pool, parent_id).await?
    } else {
        None
    };

    let total_questions = quiz.question_count.unwrap_or(10);

    Ok(Json(QuizNextResponse {
        question,
        parent_question,
        quiz_id: quiz.id,
        question_number: quiz.current_index + 1,
        total_questions,
        mode: quiz.mode,
        paper_type: quiz.paper_type,
        time_limit: quiz.time_limit,
    }))
}

/// POST /api/quiz/submit - Submit an answer and advance to next question
pub async fn submit_answer(
    State(state): State<AppState>,
    Json(request): Json<QuizSubmitRequest>,
) -> AppResult<Json<QuizSubmitResponse>> {
    // Get the question
    let question = get_question_by_id(&state.db.pool, request.question_id)
        .await?
        .ok_or_else(|| AppError::NotFound("Question not found".to_string()))?;

    // Get the quiz
    let quiz = get_quiz(&state.db.pool, request.quiz_id)
        .await?
        .ok_or_else(|| AppError::NotFound("Quiz not found".to_string()))?;

    // Grade the answer using Gemini
    let is_correct = if !state.config.gemini_api_key.is_empty() {
        let client = GeminiClient::new(
            state.http_client.clone(),
            &state.config.gemini_api_key,
            state.prompt_loader.clone(),
        );
        client
            .grade_answer(
                &question.question_latex,
                &request.answer_latex,
                &question.answer_latex,
            )
            .await
            .unwrap_or(false)
    } else {
        simple_check_answer(&request.answer_latex, &question.answer_latex)
    };

    // Store the answer
    let answer = QuizAnswer {
        id: Uuid::new_v4(),
        quiz_id: request.quiz_id,
        question_id: request.question_id,
        answer_latex: request.answer_latex.clone(),
        is_correct,
        time_taken: request.time_taken,
        answered_at: None,
    };
    insert_quiz_answer(&state.db.pool, &answer).await?;

    // Advance quiz index
    update_quiz_index(&state.db.pool, quiz.id, quiz.current_index + 1).await?;

    // Update progress
    upsert_progress(
        &state.db.pool,
        &quiz.subject,
        &quiz.topic,
        is_correct,
        question.difficulty,
    )
    .await?;

    Ok(Json(QuizSubmitResponse {
        is_correct,
        correct_answer: question.answer_latex,
        solution: question.solution_steps,
        next_difficulty: EXAM_DIFFICULTY,
    }))
}

/// GET /api/quiz/history - Get quiz history
pub async fn get_history(State(state): State<AppState>) -> AppResult<Json<Vec<QuizWithStats>>> {
    let history = crate::db::get_quiz_history(&state.db.pool, 20).await?;
    Ok(Json(history))
}

/// Simple answer checking fallback
fn simple_check_answer(user_answer: &str, correct_answer: &str) -> bool {
    let normalize = |s: &str| {
        s.replace(" ", "")
            .replace(r"\left", "")
            .replace(r"\right", "")
            .replace(r"\cdot", "*")
            .to_lowercase()
    };

    let user_normalized = normalize(user_answer);
    let correct_normalized = normalize(correct_answer);

    if user_normalized == correct_normalized {
        return true;
    }

    if correct_normalized.contains(&user_normalized)
        || user_normalized.contains(&correct_normalized)
    {
        return true;
    }

    let extract_numbers = |s: &str| -> Vec<f64> {
        s.split(|c: char| !c.is_numeric() && c != '.' && c != '-')
            .filter_map(|n| n.parse().ok())
            .collect()
    };

    let user_numbers = extract_numbers(&user_normalized);
    let correct_numbers = extract_numbers(&correct_normalized);

    if !user_numbers.is_empty() && user_numbers == correct_numbers {
        return true;
    }

    false
}

/// Helper to get quiz answer
async fn get_quiz_answer(
    pool: &sqlx::PgPool,
    quiz_id: Uuid,
    question_id: Uuid,
) -> Result<Option<QuizAnswer>, sqlx::Error> {
    sqlx::query_as::<_, QuizAnswer>(
        "SELECT * FROM quiz_answers WHERE quiz_id = $1 AND question_id = $2",
    )
    .bind(quiz_id)
    .bind(question_id)
    .fetch_optional(pool)
    .await
}

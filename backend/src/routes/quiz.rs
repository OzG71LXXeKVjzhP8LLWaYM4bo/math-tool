use axum::{
    extract::{Query, State},
    Json,
};
use uuid::Uuid;

use crate::db::{
    add_question_to_quiz, create_quiz, get_question_by_id, get_quiz,
    insert_question, insert_quiz_answer, update_quiz_index, upsert_progress,
    QuizWithStats,
};
use crate::error::{AppError, AppResult};
use crate::models::{QuizAnswer, QuizNextRequest, QuizNextResponse, QuizSubmitRequest, QuizSubmitResponse};
use crate::services::GeminiClient;
use crate::AppState;

// Fixed exam-level difficulty for all questions
const EXAM_DIFFICULTY: i32 = 4;

pub async fn get_next_question(
    State(state): State<AppState>,
    Query(request): Query<QuizNextRequest>,
) -> AppResult<Json<QuizNextResponse>> {
    // Get or create quiz
    let quiz = if let Some(quiz_id) = request.quiz_id {
        get_quiz(&state.db.pool, quiz_id)
            .await?
            .ok_or_else(|| AppError::NotFound("Quiz not found".to_string()))?
    } else {
        // Create a new quiz (start with empty question_ids, will be populated as we go)
        create_quiz(&state.db.pool, &request.subject, &request.topic, &[]).await?
    };

    let current_index = quiz.current_index as usize;

    // Check if we have a pre-generated question at this index
    let question = if current_index < quiz.question_ids.len() {
        // Return existing question from the quiz
        let question_id = quiz.question_ids[current_index];
        get_question_by_id(&state.db.pool, question_id)
            .await?
            .ok_or_else(|| AppError::NotFound("Question not found".to_string()))?
    } else {
        // Generate a new question and add it to the quiz
        let generated_question = if !state.config.gemini_api_key.is_empty() {
            let client = GeminiClient::new(
                state.http_client.clone(),
                &state.config.gemini_api_key,
                state.prompt_loader.clone(),
            );
            client
                .generate_question(&request.subject, &request.topic, EXAM_DIFFICULTY)
                .await?
        } else {
            return Err(AppError::Internal("No Gemini API key configured".to_string()));
        };

        // Insert the question into the database
        let saved_question = insert_question(&state.db.pool, &generated_question).await?;

        // Add question to quiz
        add_question_to_quiz(&state.db.pool, quiz.id, saved_question.id).await?;

        saved_question
    };

    // Check if this is a multi-part question - get parent if exists
    let parent_question = if let Some(parent_id) = question.parent_id {
        get_question_by_id(&state.db.pool, parent_id).await?
    } else {
        None
    };

    // Update quiz index
    update_quiz_index(&state.db.pool, quiz.id, quiz.current_index + 1).await?;

    Ok(Json(QuizNextResponse {
        question,
        parent_question,
        quiz_id: quiz.id,
        question_number: quiz.current_index + 1,
        total_questions: 10, // Default quiz length
    }))
}

pub async fn submit_answer(
    State(state): State<AppState>,
    Json(request): Json<QuizSubmitRequest>,
) -> AppResult<Json<QuizSubmitResponse>> {
    // Get the question to check the answer
    let question = get_question_by_id(&state.db.pool, request.question_id)
        .await?
        .ok_or_else(|| AppError::NotFound("Question not found".to_string()))?;

    // Get the quiz to know the subject/topic
    let quiz = get_quiz(&state.db.pool, request.quiz_id)
        .await?
        .ok_or_else(|| AppError::NotFound("Quiz not found".to_string()))?;

    // Check if answer is correct
    let is_correct = check_answer(&request.answer_latex, &question.answer_latex);

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

pub async fn get_history(
    State(state): State<AppState>,
) -> AppResult<Json<Vec<QuizWithStats>>> {
    let history = crate::db::get_quiz_history(&state.db.pool, 20).await?;
    Ok(Json(history))
}

/// Simple answer checking (in production, use symbolic math for equivalence)
fn check_answer(user_answer: &str, correct_answer: &str) -> bool {
    // Normalize both answers
    let normalize = |s: &str| {
        s.replace(" ", "")
            .replace(r"\left", "")
            .replace(r"\right", "")
            .replace(r"\cdot", "*")
            .to_lowercase()
    };

    let user_normalized = normalize(user_answer);
    let correct_normalized = normalize(correct_answer);

    // Check exact match after normalization
    if user_normalized == correct_normalized {
        return true;
    }

    // Check if the user's answer contains the correct answer (for simple cases)
    if correct_normalized.contains(&user_normalized) || user_normalized.contains(&correct_normalized) {
        return true;
    }

    // Try to extract numeric values and compare
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

use axum::{
    extract::{Query, State},
    Json,
};
use uuid::Uuid;

use crate::db::{
    create_quiz_session, get_question_by_id, get_questions_by_topic, get_quiz_session,
    get_recent_answers, insert_quiz_answer, update_quiz_session_index, upsert_progress,
};
use crate::error::{AppError, AppResult};
use crate::models::{QuizAnswer, QuizNextRequest, QuizNextResponse, QuizSubmitRequest, QuizSubmitResponse};
use crate::services::{calculate_next_difficulty, GeminiClient};
use crate::AppState;

pub async fn get_next_question(
    State(state): State<AppState>,
    Query(request): Query<QuizNextRequest>,
) -> AppResult<Json<QuizNextResponse>> {
    // Get or create quiz session
    let session = if let Some(session_id) = request.session_id {
        get_quiz_session(&state.db.pool, session_id)
            .await?
            .ok_or_else(|| AppError::NotFound("Quiz session not found".to_string()))?
    } else {
        create_quiz_session(&state.db.pool, &request.subject, &request.topic).await?
    };

    // Get recent answers to determine difficulty
    let recent_answers = get_recent_answers(&state.db.pool, &request.subject, &request.topic, 5).await?;

    let current_difficulty = if recent_answers.is_empty() {
        3 // Start at medium difficulty
    } else {
        calculate_next_difficulty(3, &recent_answers, 50)
    };

    // Try to get a question from the database first
    let questions = get_questions_by_topic(
        &state.db.pool,
        &request.subject,
        &request.topic,
        Some(current_difficulty),
        1,
    )
    .await?;

    let question = if let Some(q) = questions.into_iter().next() {
        q
    } else {
        // Generate a new question if none in database
        if !state.config.gemini_api_key.is_empty() {
            let client = GeminiClient::new(
                state.http_client.clone(),
                &state.config.gemini_api_key,
                state.prompt_loader.clone(),
            );
            client
                .generate_question(&request.subject, &request.topic, current_difficulty)
                .await?
        } else {
            // Use fallback template question
            super::question::generate_question(
                State(state.clone()),
                Json(crate::models::GenerateQuestionRequest {
                    subject: request.subject.clone(),
                    topic: request.topic.clone(),
                    difficulty: Some(current_difficulty),
                    count: Some(1),
                }),
            )
            .await?
            .0
            .questions
            .into_iter()
            .next()
            .ok_or_else(|| AppError::Internal("Failed to generate question".to_string()))?
        }
    };

    // Update session index
    update_quiz_session_index(&state.db.pool, session.id, session.current_index + 1).await?;

    Ok(Json(QuizNextResponse {
        question,
        session_id: session.id,
        question_number: session.current_index + 1,
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

    // Get the session to know the subject/topic
    let session = get_quiz_session(&state.db.pool, request.session_id)
        .await?
        .ok_or_else(|| AppError::NotFound("Quiz session not found".to_string()))?;

    // Check if answer is correct (simplified check - in production, use symbolic math)
    let is_correct = check_answer(&request.answer_latex, &question.answer_latex);

    // Store the answer
    let answer = QuizAnswer {
        id: Uuid::new_v4(),
        session_id: request.session_id,
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
        &session.subject,
        &session.topic,
        is_correct,
        question.difficulty,
    )
    .await?;

    // Calculate next difficulty
    let recent_answers = get_recent_answers(&state.db.pool, &session.subject, &session.topic, 5).await?;
    let next_difficulty = calculate_next_difficulty(question.difficulty, &recent_answers, 50);

    Ok(Json(QuizSubmitResponse {
        is_correct,
        correct_answer: question.answer_latex,
        solution: question.solution_steps,
        next_difficulty,
    }))
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

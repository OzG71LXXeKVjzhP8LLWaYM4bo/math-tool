use axum::{extract::State, Json};

use crate::db::insert_question;
use crate::error::AppResult;
use crate::models::{GenerateQuestionRequest, GenerateQuestionResponse, Question};
use crate::services::GeminiClient;
use crate::AppState;

pub async fn generate_question(
    State(state): State<AppState>,
    Json(request): Json<GenerateQuestionRequest>,
) -> AppResult<Json<GenerateQuestionResponse>> {
    let count = request.count.unwrap_or(1).min(5); // Max 5 questions at a time
    let difficulty = request.difficulty.unwrap_or(3).clamp(1, 5);

    let mut questions: Vec<Question> = Vec::with_capacity(count as usize);

    // Check if Gemini API key is configured
    if !state.config.gemini_api_key.is_empty() {
        let client = GeminiClient::new(
            state.http_client.clone(),
            &state.config.gemini_api_key,
            state.prompt_loader.clone(),
        );

        for _ in 0..count {
            match client
                .generate_question(&request.subject, &request.topic, difficulty, None)
                .await
            {
                Ok(question) => {
                    // Store in database
                    if let Ok(stored) = insert_question(&state.db.pool, &question).await {
                        questions.push(stored);
                    } else {
                        questions.push(question);
                    }
                }
                Err(e) => {
                    tracing::warn!("Failed to generate question: {}", e);
                    // Fall back to template question
                    let fallback = create_fallback_question(&request.subject, &request.topic, difficulty);
                    questions.push(fallback);
                }
            }
        }
    } else {
        // No API key, use template questions
        tracing::info!("No Gemini API key configured, using template questions");
        for _ in 0..count {
            let question = create_fallback_question(&request.subject, &request.topic, difficulty);
            questions.push(question);
        }
    }

    Ok(Json(GenerateQuestionResponse { questions }))
}

fn create_fallback_question(subject: &str, topic: &str, difficulty: i32) -> Question {
    use crate::models::SolutionStep;

    // Template questions by subject and topic
    let (question, answer, steps) = match (subject, topic) {
        ("math", "Calculus") => (
            r"Find \frac{d}{dx}\left(x^3 + 2x^2 - 5x + 1\right)".to_string(),
            r"3x^2 + 4x - 5".to_string(),
            vec![
                SolutionStep {
                    step_number: 1,
                    description: "Apply power rule to each term".to_string(),
                    expression_latex: r"\frac{d}{dx}(x^n) = nx^{n-1}".to_string(),
                },
                SolutionStep {
                    step_number: 2,
                    description: "Differentiate x^3".to_string(),
                    expression_latex: r"3x^2".to_string(),
                },
                SolutionStep {
                    step_number: 3,
                    description: "Differentiate 2x^2".to_string(),
                    expression_latex: r"4x".to_string(),
                },
                SolutionStep {
                    step_number: 4,
                    description: "Differentiate -5x".to_string(),
                    expression_latex: r"-5".to_string(),
                },
                SolutionStep {
                    step_number: 5,
                    description: "Combine results".to_string(),
                    expression_latex: r"3x^2 + 4x - 5".to_string(),
                },
            ],
        ),
        ("math", "Algebra") => (
            r"Solve for x: 2x^2 - 5x - 3 = 0".to_string(),
            r"x = 3 \text{ or } x = -\frac{1}{2}".to_string(),
            vec![
                SolutionStep {
                    step_number: 1,
                    description: "Use quadratic formula".to_string(),
                    expression_latex: r"x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}".to_string(),
                },
                SolutionStep {
                    step_number: 2,
                    description: "Substitute values a=2, b=-5, c=-3".to_string(),
                    expression_latex: r"x = \frac{5 \pm \sqrt{25 + 24}}{4}".to_string(),
                },
                SolutionStep {
                    step_number: 3,
                    description: "Simplify".to_string(),
                    expression_latex: r"x = \frac{5 \pm 7}{4}".to_string(),
                },
                SolutionStep {
                    step_number: 4,
                    description: "Find solutions".to_string(),
                    expression_latex: r"x = 3 \text{ or } x = -\frac{1}{2}".to_string(),
                },
            ],
        ),
        ("physics", "Mechanics") => (
            r"A ball is thrown vertically upward with initial velocity 20 \text{ m/s}. Find the maximum height reached. (g = 10 \text{ m/s}^2)".to_string(),
            r"h = 20 \text{ m}".to_string(),
            vec![
                SolutionStep {
                    step_number: 1,
                    description: "Use kinematic equation".to_string(),
                    expression_latex: r"v^2 = u^2 - 2gh".to_string(),
                },
                SolutionStep {
                    step_number: 2,
                    description: "At maximum height, v = 0".to_string(),
                    expression_latex: r"0 = (20)^2 - 2(10)h".to_string(),
                },
                SolutionStep {
                    step_number: 3,
                    description: "Solve for h".to_string(),
                    expression_latex: r"h = \frac{400}{20} = 20 \text{ m}".to_string(),
                },
            ],
        ),
        ("chemistry", "Stoichiometry") => (
            r"How many moles of water are produced when 2 moles of H_2 react with excess O_2?".to_string(),
            r"2 \text{ mol}".to_string(),
            vec![
                SolutionStep {
                    step_number: 1,
                    description: "Write balanced equation".to_string(),
                    expression_latex: r"2H_2 + O_2 \rightarrow 2H_2O".to_string(),
                },
                SolutionStep {
                    step_number: 2,
                    description: "From stoichiometry, 2 mol H2 produces 2 mol H2O".to_string(),
                    expression_latex: r"n(H_2O) = 2 \text{ mol}".to_string(),
                },
            ],
        ),
        _ => (
            format!(r"Sample {} question on {}", subject, topic),
            r"x = 1".to_string(),
            vec![SolutionStep {
                step_number: 1,
                description: "Solution step".to_string(),
                expression_latex: r"x = 1".to_string(),
            }],
        ),
    };

    Question::new(subject, topic, difficulty, &question, &answer, steps, "template")
}

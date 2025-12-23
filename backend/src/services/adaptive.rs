use crate::models::QuizAnswer;

/// Calculate the next difficulty level based on recent performance.
///
/// Algorithm:
/// - If accuracy >= 80%: increase difficulty by 1
/// - If accuracy <= 40%: decrease difficulty by 1
/// - Otherwise: keep same difficulty
///
/// Difficulty is clamped between 1 and 5.
pub fn calculate_next_difficulty(
    current_difficulty: i32,
    recent_answers: &[QuizAnswer],
    _mastery_level: i32,
) -> i32 {
    if recent_answers.is_empty() {
        return current_difficulty;
    }

    let recent_count = recent_answers.len().min(5);
    let correct_count = recent_answers
        .iter()
        .take(recent_count)
        .filter(|a| a.is_correct)
        .count();

    let accuracy = correct_count as f32 / recent_count as f32;

    let adjustment = if accuracy >= 0.8 {
        1 // Increase difficulty
    } else if accuracy <= 0.4 {
        -1 // Decrease difficulty
    } else {
        0 // Stay same
    };

    (current_difficulty + adjustment).clamp(1, 5)
}

/// Calculate mastery level based on overall performance.
///
/// Mastery increases with correct answers and decreases with incorrect ones.
/// Range: 0-100
pub fn calculate_mastery_change(is_correct: bool, current_mastery: i32) -> i32 {
    if is_correct {
        (current_mastery + 2).min(100)
    } else {
        (current_mastery - 1).max(0)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use uuid::Uuid;

    fn create_answer(is_correct: bool) -> QuizAnswer {
        QuizAnswer {
            id: Uuid::new_v4(),
            session_id: Uuid::new_v4(),
            question_id: Uuid::new_v4(),
            answer_latex: "x = 1".to_string(),
            is_correct,
            time_taken: 30,
            answered_at: None,
        }
    }

    #[test]
    fn test_increase_difficulty_on_high_accuracy() {
        let answers = vec![
            create_answer(true),
            create_answer(true),
            create_answer(true),
            create_answer(true),
            create_answer(true),
        ];
        assert_eq!(calculate_next_difficulty(3, &answers, 50), 4);
    }

    #[test]
    fn test_decrease_difficulty_on_low_accuracy() {
        let answers = vec![
            create_answer(false),
            create_answer(false),
            create_answer(false),
            create_answer(true),
            create_answer(false),
        ];
        assert_eq!(calculate_next_difficulty(3, &answers, 50), 2);
    }

    #[test]
    fn test_difficulty_clamped() {
        let good_answers = vec![create_answer(true); 5];
        assert_eq!(calculate_next_difficulty(5, &good_answers, 100), 5);

        let bad_answers = vec![create_answer(false); 5];
        assert_eq!(calculate_next_difficulty(1, &bad_answers, 0), 1);
    }
}

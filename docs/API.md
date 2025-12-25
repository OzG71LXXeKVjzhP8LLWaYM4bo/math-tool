# API Documentation

Base URL: `http://localhost:3000/api`

## Endpoints

### Health Check

```
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "version": "0.1.0"
}
```

---

### OCR - Image to LaTeX

Convert a handwritten or typed image to LaTeX notation.

```
POST /api/ocr
```

**Request Body:**
```json
{
  "image_base64": "data:image/png;base64,iVBORw0KGgo..."
}
```

**Response:**
```json
{
  "success": true,
  "latex": "x^2 + 2x - 3 = 0",
  "confidence": 0.92,
  "error": null
}
```

**Error Response:**
```json
{
  "success": false,
  "latex": null,
  "confidence": 0.0,
  "error": "Failed to process image"
}
```

---

### Generate Question

Generate an IB HL-style question using AI.

```
POST /api/generate-question
```

**Request Body:**
```json
{
  "subject": "math",
  "topic": "Calculus",
  "difficulty": 3,
  "count": 1
}
```

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `subject` | string | Yes | Subject: `math`, `physics`, `chemistry` |
| `topic` | string | Yes | Topic within the subject |
| `difficulty` | integer | No | Difficulty 1-5 (default: 3) |
| `count` | integer | No | Number of questions (default: 1, max: 5) |

**Response:**
```json
{
  "questions": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "subject": "math",
      "topic": "Calculus",
      "subtopic": "Differentiation",
      "difficulty": 3,
      "question_latex": "Find \\frac{d}{dx}(x^3 \\sin x)",
      "answer_latex": "3x^2 \\sin x + x^3 \\cos x",
      "solution_steps": [
        {
          "step_number": 1,
          "description": "Apply product rule",
          "expression_latex": "\\frac{d}{dx}(uv) = u'v + uv'"
        }
      ],
      "hints": ["Use the product rule", "Remember: d/dx(sin x) = cos x"],
      "source": "generated",
      "created_at": "2024-12-24T10:30:00Z"
    }
  ]
}
```

---

### Quiz - Create New Quiz

Create a new quiz session and get the first question.

```
POST /api/quiz
```

**Request Body:**
```json
{
  "subject": "math",
  "topic": "Calculus",
  "mode": "quiz",
  "paper_type": "paper1",
  "question_count": 10
}
```

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `subject` | string | Yes | Subject: `math`, `physics`, `chemistry` |
| `topic` | string | Yes | Topic within the subject |
| `mode` | string | No | `quiz` (default) or `exam` |
| `paper_type` | string | No | `paper1`, `paper2`, or `paper3` |
| `question_count` | integer | No | Number of questions (default: 10) |

**Response:**
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "subject": "math",
  "topic": "Calculus",
  "current_index": 0,
  "question_count": 10,
  "mode": "quiz",
  "paper_type": "paper1",
  "questions": [
    {
      "question": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "question_latex": "Find \\frac{d}{dx}(x^3)",
        ...
      },
      "user_answer": null,
      "is_correct": null
    }
  ]
}
```

---

### Quiz - Get Existing Quiz

Resume an existing quiz session.

```
GET /api/quiz/:id
```

**Response:** Same as POST /api/quiz

---

### Quiz - Get Next Question

Get the next question for an existing quiz.

```
GET /api/quiz/next?quiz_id=660e8400-e29b-41d4-a716-446655440001
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `quiz_id` | string | Yes | Existing quiz session ID |

**Response:**
```json
{
  "question": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "subject": "math",
    "topic": "Calculus",
    "difficulty": 3,
    "question_latex": "Evaluate \\int_0^1 x^2 dx",
    "answer_latex": "\\frac{1}{3}",
    "solution_steps": [...],
    "source": "generated"
  },
  "quiz_id": "660e8400-e29b-41d4-a716-446655440001",
  "question_number": 2,
  "total_questions": 10,
  "mode": "quiz",
  "paper_type": "paper1"
}
```

---

### Quiz - Submit Answer

Submit an answer and get feedback.

```
POST /api/quiz/submit
```

**Request Body:**
```json
{
  "session_id": "660e8400-e29b-41d4-a716-446655440001",
  "question_id": "550e8400-e29b-41d4-a716-446655440000",
  "answer_latex": "\\frac{1}{3}",
  "time_taken": 45
}
```

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `session_id` | string | Yes | Current quiz session ID |
| `question_id` | string | Yes | Question being answered |
| `answer_latex` | string | Yes | User's answer in LaTeX |
| `time_taken` | integer | Yes | Time spent in seconds |

**Response:**
```json
{
  "is_correct": true,
  "correct_answer": "\\frac{1}{3}",
  "solution": [
    {
      "step_number": 1,
      "description": "Apply power rule for integration",
      "expression_latex": "\\int x^n dx = \\frac{x^{n+1}}{n+1}"
    },
    {
      "step_number": 2,
      "description": "Evaluate the definite integral",
      "expression_latex": "\\left[\\frac{x^3}{3}\\right]_0^1 = \\frac{1}{3} - 0 = \\frac{1}{3}"
    }
  ],
  "next_difficulty": 4
}
```

---

### Progress - Get Progress

Get user progress data.

```
GET /api/progress
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `subject` | string | No | Filter by subject |
| `topic` | string | No | Filter by topic |

**Response:**
```json
{
  "progress": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440002",
      "subject": "math",
      "topic": "Calculus",
      "total_attempts": 25,
      "correct_answers": 20,
      "average_difficulty": 3.2,
      "current_streak": 5,
      "mastery_level": 75,
      "last_activity": "2024-12-24T10:30:00Z"
    }
  ]
}
```

---

### Progress - Get Topic Progress

Get aggregated progress by topic.

```
GET /api/progress/topics
```

**Response:**
```json
[
  {
    "subject": "math",
    "topic": "Calculus",
    "accuracy": 0.8,
    "mastery_level": 75,
    "streak": 5
  },
  {
    "subject": "physics",
    "topic": "Mechanics",
    "accuracy": 0.65,
    "mastery_level": 45,
    "streak": 2
  }
]
```

---

## Error Handling

All endpoints return errors in a consistent format:

```json
{
  "error": "Error message description"
}
```

**HTTP Status Codes:**
| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad Request - Invalid input |
| 404 | Not Found - Resource doesn't exist |
| 500 | Internal Server Error |
| 502 | Bad Gateway - External service error |

---

## Gemini API Integration

All AI features (OCR, question generation, answer grading) use Google's Gemini API:

- **OCR**: Gemini Vision analyzes handwritten images and extracts LaTeX
- **Question Generation**: Gemini generates IB HL-style questions with solutions
- **Answer Grading**: Gemini compares user answers against correct answers

The Gemini API key is configured via the `GEMINI_API_KEY` environment variable.

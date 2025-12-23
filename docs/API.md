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

### Solve - Math Expression Solver

Solve a mathematical expression and return step-by-step solution.

```
POST /api/solve
```

**Request Body:**
```json
{
  "expression_latex": "x^2 + 2x - 3 = 0",
  "subject": "math",
  "solve_for": "x",
  "operation": "solve"
}
```

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `expression_latex` | string | Yes | LaTeX expression to solve |
| `subject` | string | No | Subject context (math/physics/chemistry) |
| `solve_for` | string | No | Variable to solve for |
| `operation` | string | No | Operation type: `solve`, `differentiate`, `integrate` |

**Response:**
```json
{
  "success": true,
  "answer_latex": "x = 1 \\text{ or } x = -3",
  "steps": [
    {
      "step_number": 1,
      "description": "Factor the quadratic",
      "expression_latex": "(x - 1)(x + 3) = 0"
    },
    {
      "step_number": 2,
      "description": "Set each factor to zero",
      "expression_latex": "x - 1 = 0 \\text{ or } x + 3 = 0"
    },
    {
      "step_number": 3,
      "description": "Solve for x",
      "expression_latex": "x = 1 \\text{ or } x = -3"
    }
  ],
  "error": null
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

### Quiz - Get Next Question

Get the next question in a quiz session.

```
GET /api/quiz/next
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `subject` | string | Yes | Subject: `math`, `physics`, `chemistry` |
| `topic` | string | Yes | Topic within the subject |
| `session_id` | string | No | Existing session ID to continue |

**Example:**
```
GET /api/quiz/next?subject=math&topic=Calculus
```

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
  "session_id": "660e8400-e29b-41d4-a716-446655440001",
  "question_number": 1,
  "total_questions": 10
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

## Python Service API (Internal)

These endpoints are called by the Rust backend, not directly by clients.

### Pix2Tex OCR

```
POST http://localhost:8000/pix2tex
```

**Request:**
```json
{
  "image_base64": "base64_encoded_image"
}
```

**Response:**
```json
{
  "success": true,
  "latex": "recognized_latex",
  "confidence": 0.95,
  "error": null
}
```

### Math Solver

```
POST http://localhost:8000/solve
```

**Request:**
```json
{
  "expression_latex": "x^2 - 4 = 0",
  "subject": "math",
  "solve_for": "x",
  "show_steps": true,
  "operation": "solve"
}
```

**Response:**
```json
{
  "success": true,
  "answer_latex": "x = \\pm 2",
  "steps": [...],
  "error": null
}
```

# Architecture Overview

## System Design

The IB Quiz App follows a microservices architecture with three main components:

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                            │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Expo / React Native App                     │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐       │   │
│  │  │  Home   │ │  Quiz   │ │  Write  │ │Progress │       │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘       │   │
│  │                                                          │   │
│  │  ┌─────────────────────────────────────────────────┐    │   │
│  │  │  Zustand Stores (quiz, canvas, progress)        │    │   │
│  │  └─────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ HTTP/REST
┌─────────────────────────────────────────────────────────────────┐
│                         API LAYER                               │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Rust + Axum Backend                         │   │
│  │                                                          │   │
│  │  Routes:                    Services:                    │   │
│  │  • /api/ocr                 • Python Client              │   │
│  │  • /api/solve               • Gemini Client              │   │
│  │  • /api/generate-question   • Adaptive Difficulty        │   │
│  │  • /api/quiz/*              • Database Queries           │   │
│  │  • /api/progress                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                    │                       │
                    ▼ HTTP                  ▼ SQL
┌───────────────────────────┐   ┌─────────────────────────────────┐
│   PROCESSING LAYER        │   │       DATA LAYER                │
├───────────────────────────┤   ├─────────────────────────────────┤
│  Python FastAPI Service   │   │   Neon PostgreSQL               │
│                           │   │                                 │
│  • Pix2Tex (OCR)          │   │   Tables:                       │
│  • SymPy (Math Solver)    │   │   • questions                   │
│                           │   │   • quiz_sessions               │
│  Endpoints:               │   │   • quiz_answers                │
│  • POST /pix2tex          │   │   • progress                    │
│  • POST /solve            │   │                                 │
└───────────────────────────┘   └─────────────────────────────────┘
```

## Component Details

### 1. Frontend (Expo/React Native)

**Location:** `/frontend`

**Key Technologies:**
- Expo SDK 54
- React Native 0.81
- TypeScript
- Zustand (state management)
- React Native SVG (drawing canvas)
- React Native WebView (LaTeX rendering)

**Screens:**
| Screen | Purpose |
|--------|---------|
| `index.tsx` | Dashboard with stats and quick actions |
| `write.tsx` | Samsung Notes-style drawing canvas |
| `quiz.tsx` | Topic selection and adaptive quiz |
| `upload.tsx` | Camera/gallery image upload for OCR |
| `progress.tsx` | Progress tracking with mastery levels |

**State Management:**
```
stores/
├── canvas-store.ts    # Drawing state (strokes, tools, undo/redo)
├── quiz-store.ts      # Quiz session, questions, answers
└── progress-store.ts  # User progress data
```

### 2. Backend (Rust + Axum)

**Location:** `/backend`

**Key Technologies:**
- Rust 2021 Edition
- Axum 0.7 (web framework)
- SQLx 0.8 (database)
- Reqwest (HTTP client)
- Tokio (async runtime)

**Module Structure:**
```
src/
├── main.rs           # Server entry point, router setup
├── config.rs         # Environment configuration
├── error.rs          # Error types and handling
├── routes/
│   ├── ocr.rs        # Image → LaTeX (proxies to Python)
│   ├── solve.rs      # Expression solving (proxies to Python)
│   ├── question.rs   # AI question generation
│   ├── quiz.rs       # Quiz session management
│   └── progress.rs   # Progress tracking
├── services/
│   ├── python_client.rs  # HTTP client for Python service
│   ├── gemini.rs         # Google Gemini API integration
│   └── adaptive.rs       # Adaptive difficulty algorithm
├── models/
│   ├── question.rs   # Question data structures
│   ├── quiz.rs       # Quiz session structures
│   └── progress.rs   # Progress data structures
└── db/
    ├── mod.rs        # Database connection pool
    └── queries.rs    # SQL queries
```

### 3. Python Microservice (FastAPI)

**Location:** `/python-service`

**Key Technologies:**
- Python 3.11+
- UV (package manager)
- FastAPI (web framework)
- Pix2Tex (OCR)
- SymPy (math solver)

**Module Structure:**
```
app/
├── routes/
│   ├── ocr.py       # POST /pix2tex - Image to LaTeX
│   └── solve.py     # POST /solve - Math solving
└── services/
    ├── ocr_service.py      # Pix2Tex integration
    └── solver_service.py   # SymPy solver with steps
```

## Data Flow

### 1. Handwriting Recognition Flow

```
User draws equation
        │
        ▼
Canvas captures strokes (SVG paths)
        │
        ▼
Export canvas as PNG (base64)
        │
        ▼
POST /api/ocr { image_base64 }
        │
        ▼
Rust backend proxies to Python
        │
        ▼
Pix2Tex model recognizes LaTeX
        │
        ▼
Return { latex: "x^2 + 2x - 3 = 0" }
```

### 2. Quiz Flow

```
User selects topic
        │
        ▼
GET /api/quiz/next?subject=math&topic=Calculus
        │
        ▼
Rust backend checks recent answers
        │
        ▼
Calculate adaptive difficulty (1-5)
        │
        ▼
Fetch/generate question at difficulty
        │
        ▼
Return question to user
        │
        ▼
User submits answer
        │
        ▼
POST /api/quiz/submit { answer_latex }
        │
        ▼
Verify answer correctness
        │
        ▼
Update progress in database
        │
        ▼
Return { is_correct, solution, next_difficulty }
```

### 3. Question Generation Flow

```
POST /api/generate-question { subject, topic, difficulty }
        │
        ▼
Build Gemini prompt with IB HL requirements
        │
        ▼
Call Gemini API
        │
        ▼
Parse JSON response (question, answer, steps)
        │
        ▼
Store in database
        │
        ▼
Return Question object
```

## Database Schema

```sql
questions
├── id (UUID, PK)
├── subject (TEXT)
├── topic (TEXT)
├── difficulty (INT 1-5)
├── question_latex (TEXT)
├── answer_latex (TEXT)
├── solution_steps (JSONB)
└── created_at (TIMESTAMPTZ)

quiz_sessions
├── id (UUID, PK)
├── subject (TEXT)
├── topic (TEXT)
├── current_index (INT)
├── started_at (TIMESTAMPTZ)
└── completed_at (TIMESTAMPTZ)

quiz_answers
├── id (UUID, PK)
├── session_id (UUID, FK)
├── question_id (UUID, FK)
├── answer_latex (TEXT)
├── is_correct (BOOL)
├── time_taken (INT)
└── answered_at (TIMESTAMPTZ)

progress
├── id (UUID, PK)
├── subject (TEXT)
├── topic (TEXT)
├── total_attempts (INT)
├── correct_answers (INT)
├── average_difficulty (REAL)
├── current_streak (INT)
├── mastery_level (INT 0-100)
└── last_activity (TIMESTAMPTZ)
```

## Adaptive Difficulty Algorithm

The system uses a simple but effective algorithm:

```rust
fn calculate_next_difficulty(
    current: i32,
    recent_answers: &[Answer],  // Last 5 answers
) -> i32 {
    let accuracy = correct_count / total_count;

    if accuracy >= 0.8 {
        return (current + 1).min(5);  // Increase
    } else if accuracy <= 0.4 {
        return (current - 1).max(1);  // Decrease
    }
    current  // Stay same
}
```

## Security Considerations

1. **No Authentication** - Single-user app, progress stored per device
2. **CORS** - Configured for development (allow all origins)
3. **Input Validation** - LaTeX input sanitized before processing
4. **Rate Limiting** - Not implemented (add for production)
5. **API Keys** - Stored in environment variables, never committed

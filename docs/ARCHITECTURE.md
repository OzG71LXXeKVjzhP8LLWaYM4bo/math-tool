# Architecture Overview

## System Design

The IB Quiz App follows a two-tier architecture with a React Native frontend and a Rust backend:

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                            │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Expo / React Native App                     │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐       │   │
│  │  │  Home   │ │  Quiz   │ │ History │ │Progress │       │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘       │   │
│  │                                                          │   │
│  │  ┌─────────────────────────────────────────────────┐    │   │
│  │  │  Zustand Stores (quiz, canvas, settings)        │    │   │
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
│  │  • /api/ocr                 • Gemini Client (OCR, Gen)   │   │
│  │  • /api/generate-question   • Prompt Loader              │   │
│  │  • /api/quiz/*              • Database Queries           │   │
│  │  • /api/progress                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                    │                       │
                    ▼ HTTPS                 ▼ SQL
┌───────────────────────────────┐   ┌─────────────────────────────────┐
│   EXTERNAL SERVICES           │   │       DATA LAYER                │
├───────────────────────────────┤   ├─────────────────────────────────┤
│  Google Gemini API            │   │   PostgreSQL (Neon)             │
│                               │   │                                 │
│  • Vision (OCR)               │   │   Tables:                       │
│  • Text Generation            │   │   • questions                   │
│  • Answer Grading             │   │   • quiz_sessions               │
│                               │   │   • quiz_answers                │
│                               │   │   • progress                    │
└───────────────────────────────┘   └─────────────────────────────────┘
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
| `quiz/index.tsx` | Topic selection and quiz configuration |
| `quiz/[id].tsx` | Active quiz with drawing canvas |
| `history.tsx` | Quiz history and resume |
| `progress.tsx` | Progress tracking with mastery levels |
| `settings.tsx` | App settings |

**State Management:**
```
stores/
├── canvas-store.ts    # Drawing state (strokes, tools, undo/redo)
├── quiz-store.ts      # Quiz session, questions, answers
└── settings-store.ts  # User preferences
```

**Drawing Canvas Features:**
- Two-finger pan and pinch-to-zoom
- S Pen button detection for eraser mode
- Undo/redo with stroke history
- Export to PNG for OCR

### 2. Backend (Rust + Axum)

**Location:** `/backend`

**Key Technologies:**
- Rust 2021 Edition
- Axum 0.7 (web framework)
- SQLx 0.8 (database)
- Reqwest (HTTP client for Gemini API)
- Tokio (async runtime)

**Module Structure:**
```
src/
├── main.rs           # Server entry point, router setup
├── config.rs         # Environment configuration
├── error.rs          # Error types and handling
├── routes/
│   ├── ocr.rs        # Image → LaTeX (Gemini Vision)
│   ├── question.rs   # AI question generation
│   ├── quiz.rs       # Quiz session management
│   └── progress.rs   # Progress tracking
├── services/
│   ├── gemini.rs     # Google Gemini API client
│   └── prompt_loader.rs  # Load prompts from files
├── models/
│   ├── question.rs   # Question data structures
│   ├── quiz.rs       # Quiz session structures
│   └── progress.rs   # Progress data structures
└── db/
    ├── mod.rs        # Database connection pool
    └── queries.rs    # SQL queries
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
Rust backend calls Gemini Vision API
        │
        ▼
Gemini recognizes handwriting → LaTeX
        │
        ▼
Return { latex: "x^2 + 2x - 3 = 0" }
```

### 2. Quiz Flow

```
User selects topic & configures quiz
        │
        ▼
POST /api/quiz { subject, topic, mode, paper_type }
        │
        ▼
Rust backend creates quiz session
        │
        ▼
Generate first question via Gemini
        │
        ▼
Return quiz with first question
        │
        ▼
User draws answer
        │
        ▼
POST /api/quiz/submit { quiz_id, answer_latex }
        │
        ▼
Gemini grades answer
        │
        ▼
Update progress in database
        │
        ▼
Return { is_correct, solution, next_difficulty }
```

### 3. Resume Quiz Flow

```
User views quiz history
        │
        ▼
GET /api/quiz/history
        │
        ▼
User selects incomplete quiz
        │
        ▼
GET /api/quiz/:id
        │
        ▼
Return quiz with all questions and answers
        │
        ▼
Resume at first unanswered question
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
├── question_count (INT)
├── mode (TEXT) -- 'quiz' or 'exam'
├── paper_type (TEXT) -- 'paper1', 'paper2', 'paper3'
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

## Security Considerations

1. **No Authentication** - Single-user app, progress stored per device
2. **CORS** - Configured for development (allow all origins)
3. **Input Validation** - LaTeX input sanitized before processing
4. **Rate Limiting** - Not implemented (add for production)
5. **API Keys** - Stored in environment variables, never committed

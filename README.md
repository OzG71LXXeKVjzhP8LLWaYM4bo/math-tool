# IB Math Quiz App

A quiz application for IB Mathematics Higher Level students with handwriting recognition, AI-powered question generation, and progress tracking.

## Architecture

```
┌─────────────────┐     ┌─────────────────┐
│  Expo/React     │────▶│  Rust + Axum    │
│  Native App     │     │  Backend API    │
└─────────────────┘     └─────────────────┘
                               │
                    ┌──────────┴──────────┐
                    ▼                     ▼
             ┌─────────────┐      ┌─────────────┐
             │   Neon      │      │   Gemini    │
             │  Postgres   │      │     API     │
             └─────────────┘      └─────────────┘
```

## Features

- **Drawing Canvas** - Write equations by hand with stylus/S Pen support, pan & zoom
- **OCR Recognition** - Convert handwriting to LaTeX using Gemini Vision
- **AI Question Generation** - IB HL-style questions via Google Gemini
- **Multi-Topic Selection** - Select multiple topics with "Select All" buttons for mixed practice
- **Cross-Topic Questions** - AI generates questions that integrate concepts across topics
- **Paper Types** - Paper 1 (no calc), Paper 2 (calc allowed), Paper 3 (investigation)
- **Batch Generation** - All quiz questions generated upfront for seamless experience
- **Immersive Mode** - Android navigation bar hidden for distraction-free practice
- **Progress Tracking** - Track mastery by topic with streaks and accuracy
- **Course Selection** - Support for Math AA and Math AI HL

## Project Structure

```
math-tool/
├── frontend/          # Expo/React Native app
│   ├── app/(tabs)/    # Tab-based navigation
│   │   ├── index.tsx      # Home screen
│   │   ├── quiz/          # Quiz flow
│   │   │   ├── index.tsx  # Topic/paper selection
│   │   │   └── [id].tsx   # Quiz player
│   │   ├── history.tsx    # Quiz history
│   │   ├── progress.tsx   # Progress tracking
│   │   └── settings.tsx   # App settings
│   ├── components/    # Reusable components
│   │   ├── input/     # DrawingCanvas, HandwritingInput
│   │   └── quiz/      # TopicSelector, AnswerInput
│   ├── stores/        # Zustand state management
│   └── services/      # API client
└── backend/           # Rust + Axum API server
    ├── src/
    │   ├── db/        # Database queries
    │   ├── models/    # Data models
    │   ├── routes/    # API endpoints
    │   └── services/  # Gemini integration
    └── prompts/       # Question generation prompts
```

## Database Schema

### Questions Table
Stores all generated questions with multi-part support:
- `parent_id` - Links sub-parts to parent question
- `part_label` - "a", "b", "c" or "i", "ii", "iii"
- `solution_steps` - JSONB array of worked solutions

### Quizzes Table
- `question_ids` - UUID array of questions in order
- `current_index` - Track progress through quiz

### Progress Table
- Per-topic mastery tracking
- Streak counting and accuracy metrics

## Setup

### 1. Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your Neon DATABASE_URL and GEMINI_API_KEY
cargo run
```

### 2. Frontend

```bash
cd frontend
npm install
npx expo start
```

## Environment Variables

### Backend (.env)
```
DATABASE_URL=postgres://user:pass@ep-xxx.neon.tech/dbname?sslmode=require
GEMINI_API_KEY=your-gemini-api-key
HOST=0.0.0.0
PORT=3000
PROMPTS_DIR=./prompts
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ocr` | POST | Handwriting → LaTeX (Gemini Vision) |
| `/api/quiz/next` | GET | Get next quiz question |
| `/api/quiz/submit` | POST | Submit answer and get solution |
| `/api/quiz/history` | GET | Get quiz history |
| `/api/progress` | GET | Get user progress |
| `/api/progress/topics` | GET | Get topic-level progress |

## Tech Stack

- **Frontend**: Expo, React Native, TypeScript, Zustand
- **Backend**: Rust, Axum, SQLx, PostgreSQL
- **Database**: Neon (Serverless PostgreSQL)
- **AI**: Google Gemini (Flash 2.0)

## IB Topics Covered

### Mathematics AA HL
- Number & Algebra
- Functions
- Geometry & Trigonometry
- Statistics & Probability
- Calculus

### Mathematics AI HL
- Number & Algebra
- Functions
- Geometry & Trigonometry
- Statistics & Probability
- Calculus

## Quiz Flow

1. **Select Mode** - New Quiz or Resume Previous
2. **Configure Session** - Choose paper type (1/2/3) and question count
3. **Select Topics** - Pick multiple topics with "Select All" buttons
4. **Answer Questions** - Write answer on canvas (with pan/zoom) or type
5. **View Solution** - See step-by-step worked solution with LaTeX
6. **Track Progress** - Mastery level updates automatically

## License

MIT

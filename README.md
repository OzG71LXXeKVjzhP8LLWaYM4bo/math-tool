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

- **Drawing Canvas** - Write equations by hand with stylus support
- **OCR Recognition** - Convert handwriting to LaTeX using Gemini Vision
- **AI Question Generation** - IB HL-style questions via Google Gemini
- **Multi-Part Questions** - Authentic IB exam style with (a), (b), (c) parts
- **Progress Tracking** - Track mastery by topic with streaks and accuracy
- **Course Selection** - Support for Math AA and Math AI HL

## Project Structure

```
math-tool/
├── frontend/          # Expo/React Native app
│   ├── app/(tabs)/    # Tab-based navigation
│   │   ├── index.tsx      # Home screen
│   │   ├── quiz/          # Quiz flow
│   │   │   ├── index.tsx  # Topic selection
│   │   │   └── [id].tsx   # Quiz player
│   │   ├── history.tsx    # Quiz history
│   │   └── progress.tsx   # Progress tracking
│   ├── components/    # Reusable components
│   ├── stores/        # Zustand state management
│   └── services/      # API client
├── backend/           # Rust + Axum API server
│   ├── src/
│   │   ├── db/        # Database queries
│   │   ├── models/    # Data models
│   │   ├── routes/    # API endpoints
│   │   └── services/  # Gemini integration
│   └── prompts/       # Question generation prompts
└── python-service/    # Python microservice (optional)
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

1. **Select Mode** - New Quiz or Continue Previous
2. **Choose Topic** - Pick subject area and subtopic
3. **Answer Questions** - Write answer on canvas or type
4. **View Solution** - See step-by-step worked solution
5. **Track Progress** - Mastery level updates automatically

## License

MIT

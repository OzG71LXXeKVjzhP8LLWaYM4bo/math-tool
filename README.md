# IB HL Math/Physics/Chemistry Quiz App

A comprehensive quiz application for IB Higher Level students with handwriting recognition, AI-powered question generation, and adaptive difficulty.

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Expo/React     │────▶│  Rust + Axum    │────▶│  Python FastAPI │
│  Native App     │     │  Backend API    │     │  Microservice   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │  Neon Postgres  │
                        └─────────────────┘
```

## Features

- **Samsung Notes-style Drawing Canvas** - Write equations by hand
- **OCR Recognition** - Convert handwriting to LaTeX using Pix2Tex
- **Math Solver** - Step-by-step solutions using SymPy
- **AI Question Generation** - IB HL-style questions via Google Gemini
- **Adaptive Quizzes** - Difficulty adjusts based on performance
- **Progress Tracking** - Track mastery by topic

## Project Structure

```
math-tool/
├── frontend/          # Expo/React Native app
├── backend/           # Rust + Axum API server
└── python-service/    # Python microservice (OCR + Solver)
```

## Setup

### 1. Python Microservice

```bash
cd python-service
uv sync
uv run uvicorn main:app --reload --port 8000
```

### 2. Rust Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your Neon DATABASE_URL and GEMINI_API_KEY
cargo run
```

### 3. Frontend

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
PYTHON_SERVICE_URL=http://localhost:8000
PORT=3000
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ocr` | POST | Image → LaTeX conversion |
| `/api/solve` | POST | Solve math expression |
| `/api/generate-question` | POST | Generate IB-style question |
| `/api/quiz/next` | GET | Get next quiz question |
| `/api/quiz/submit` | POST | Submit answer |
| `/api/progress` | GET | Get user progress |

## Tech Stack

- **Frontend**: Expo, React Native, TypeScript, Zustand
- **Backend**: Rust, Axum, SQLx, PostgreSQL
- **Python**: FastAPI, Pix2Tex, SymPy
- **Database**: Neon (Serverless PostgreSQL)
- **AI**: Google Gemini

## IB Topics Covered

### Mathematics HL
- Algebra, Functions, Calculus, Statistics, Geometry

### Physics HL
- Mechanics, Waves, Electricity, Thermal Physics, Nuclear

### Chemistry HL
- Stoichiometry, Bonding, Energetics, Kinetics, Equilibrium

## Documentation

- [Setup Guide](./docs/SETUP.md) - Detailed installation instructions
- [Architecture](./docs/ARCHITECTURE.md) - System design and data flow
- [API Reference](./docs/API.md) - Complete API documentation
- [Development Guide](./docs/DEVELOPMENT.md) - Contributing and coding standards

## Screenshots

| Home | Write | Quiz | Progress |
|------|-------|------|----------|
| Dashboard with stats | Drawing canvas | Topic selection | Mastery tracking |

## License

MIT

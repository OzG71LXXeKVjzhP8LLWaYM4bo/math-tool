# Development Guide

This guide covers development workflows, coding standards, and contribution guidelines.

## Development Workflow

### Running All Services

Open three terminal windows:

**Terminal 1 - Python Service:**
```bash
cd python-service
uv run uvicorn main:app --reload --port 8000
```

**Terminal 2 - Rust Backend:**
```bash
cd backend
cargo watch -x run  # Install with: cargo install cargo-watch
```

**Terminal 3 - Frontend:**
```bash
cd frontend
npx expo start
```

---

## Project Structure

```
math-tool/
├── frontend/                 # React Native / Expo app
│   ├── app/                  # File-based routing (expo-router)
│   │   └── (tabs)/           # Tab screens
│   ├── components/           # Reusable components
│   ├── stores/               # Zustand state stores
│   ├── services/             # API client
│   ├── types/                # TypeScript types
│   └── constants/            # Config and constants
│
├── backend/                  # Rust / Axum server
│   └── src/
│       ├── routes/           # API route handlers
│       ├── services/         # Business logic
│       ├── models/           # Data structures
│       └── db/               # Database queries
│
├── python-service/           # Python / FastAPI microservice
│   └── app/
│       ├── routes/           # API endpoints
│       └── services/         # OCR and solver logic
│
└── docs/                     # Documentation
```

---

## Coding Standards

### TypeScript (Frontend)

**Style:**
- Use functional components with hooks
- Use TypeScript strict mode
- Prefer `const` over `let`
- Use named exports

**Naming:**
- Components: `PascalCase` (`QuestionCard.tsx`)
- Hooks: `camelCase` with `use` prefix (`useQuizStore`)
- Types/Interfaces: `PascalCase` (`Question`, `QuizSession`)
- Constants: `SCREAMING_SNAKE_CASE` (`API_BASE_URL`)

**Example Component:**
```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface QuestionCardProps {
  question: Question;
  onAnswer: (answer: string) => void;
}

export function QuestionCard({ question, onAnswer }: QuestionCardProps) {
  return (
    <View style={styles.container}>
      <Text>{question.question_latex}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
});
```

### Rust (Backend)

**Style:**
- Follow Rust standard naming conventions
- Use `thiserror` for error types
- Use `tracing` for logging
- Prefer `async` functions

**Naming:**
- Modules: `snake_case` (`python_client.rs`)
- Functions: `snake_case` (`get_next_question`)
- Types/Structs: `PascalCase` (`Question`, `AppState`)
- Constants: `SCREAMING_SNAKE_CASE` (`GEMINI_API_URL`)

**Example Handler:**
```rust
use axum::{extract::State, Json};
use crate::{error::AppResult, models::Question, AppState};

pub async fn get_question(
    State(state): State<AppState>,
    Json(request): Json<GetQuestionRequest>,
) -> AppResult<Json<Question>> {
    let question = state.db.get_question(&request.id).await?;
    Ok(Json(question))
}
```

### Python (Microservice)

**Style:**
- Use type hints
- Use Pydantic for request/response models
- Follow PEP 8

**Example Endpoint:**
```python
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class SolveRequest(BaseModel):
    expression_latex: str
    operation: str = "solve"

class SolveResponse(BaseModel):
    success: bool
    answer_latex: str

@router.post("", response_model=SolveResponse)
async def solve(request: SolveRequest) -> SolveResponse:
    # Implementation
    pass
```

---

## Adding New Features

### Adding a New API Endpoint

1. **Rust Backend:**
   ```rust
   // src/routes/new_feature.rs
   pub async fn new_endpoint(...) -> AppResult<Json<Response>> {
       // Implementation
   }
   ```

2. **Register in main.rs:**
   ```rust
   .route("/api/new-endpoint", post(routes::new_feature::new_endpoint))
   ```

3. **Frontend API Service:**
   ```typescript
   // services/api.ts
   async newFeature(request: NewFeatureRequest): Promise<NewFeatureResponse> {
     return this.request('/new-endpoint', {
       method: 'POST',
       body: JSON.stringify(request),
     });
   }
   ```

### Adding a New Screen

1. Create the screen file:
   ```bash
   touch frontend/app/(tabs)/new-screen.tsx
   ```

2. Add to tab layout (`frontend/app/(tabs)/_layout.tsx`):
   ```tsx
   <Tabs.Screen
     name="new-screen"
     options={{
       title: 'New Screen',
       tabBarIcon: ({ color }) => (
         <Ionicons name="icon-name" size={28} color={color} />
       ),
     }}
   />
   ```

### Adding a New IB Topic

1. Update `frontend/constants/topics.ts`:
   ```typescript
   export const IB_TOPICS = {
     math: {
       // ...existing topics
       'New Category': ['Topic 1', 'Topic 2'],
     },
   };
   ```

2. Add template questions in `backend/src/routes/question.rs`:
   ```rust
   ("math", "New Topic") => (
       r"Question LaTeX".to_string(),
       r"Answer LaTeX".to_string(),
       vec![/* solution steps */],
   ),
   ```

---

## Testing

### Frontend

```bash
cd frontend
npm test
```

### Backend

```bash
cd backend
cargo test
```

### Python Service

```bash
cd python-service
uv run pytest
```

---

## Database Migrations

The backend automatically runs migrations on startup. To add a new table:

1. Add SQL in `backend/src/db/mod.rs`:
   ```rust
   sqlx::query(r#"
       CREATE TABLE IF NOT EXISTS new_table (
           id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
           -- columns
       )
   "#)
   .execute(&self.pool)
   .await?;
   ```

2. Add queries in `backend/src/db/queries.rs`

---

## Environment Variables

### Backend (.env)

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | Neon PostgreSQL connection string | Yes |
| `GEMINI_API_KEY` | Google Gemini API key | No (templates used as fallback) |
| `PYTHON_SERVICE_URL` | Python service URL | Yes |
| `PORT` | Server port | No (default: 3000) |
| `HOST` | Server host | No (default: 0.0.0.0) |
| `PROMPTS_DIR` | Directory for prompt templates | No (default: ./prompts) |

### Frontend

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_API_URL` | Backend API URL |

---

## Debugging

### Frontend (React Native)

1. Enable Debug Mode in Expo
2. Use React DevTools
3. Use `console.log` or React Native Debugger

### Backend (Rust)

1. Use `tracing` macros:
   ```rust
   tracing::info!("Processing request: {:?}", request);
   tracing::error!("Error occurred: {:?}", error);
   ```

2. Set log level in `RUST_LOG`:
   ```bash
   RUST_LOG=debug cargo run
   ```

### Python Service

1. Use `print()` or `logging`
2. FastAPI automatic docs at `/docs`

---

## Performance Tips

### Frontend

- Use `React.memo` for expensive components
- Lazy load screens with `React.lazy`
- Optimize images with `expo-image`
- Use `FlatList` for long lists

### Backend

- Use connection pooling (already configured)
- Cache frequently accessed data
- Use database indexes for common queries

### Python

- Cache Pix2Tex model (singleton pattern)
- Use async handlers for I/O operations

---

## Common Tasks

### Reset Database

```sql
-- In Neon console
DROP TABLE IF EXISTS quiz_answers;
DROP TABLE IF EXISTS quiz_sessions;
DROP TABLE IF EXISTS questions;
DROP TABLE IF EXISTS progress;
```

Then restart the backend to recreate tables.

### Clear Frontend Cache

```bash
cd frontend
npx expo start --clear
```

### Update Dependencies

**Frontend:**
```bash
cd frontend
npm update
```

**Backend:**
```bash
cd backend
cargo update
```

**Python:**
```bash
cd python-service
uv lock --upgrade
uv sync
```

---

## Customizing Prompts

The AI prompts for question generation are stored in external files that can be edited without recompiling the backend.

### Prompt Directory Structure

```
backend/prompts/
├── question_generation.txt       # Default prompt template
├── math/
│   └── question_generation.txt   # Math-specific prompt
├── physics/
│   └── question_generation.txt   # Physics-specific prompt
└── chemistry/
    └── question_generation.txt   # Chemistry-specific prompt
```

### Template Variables

Prompts use `{{variable}}` syntax for substitution:

| Variable | Description |
|----------|-------------|
| `{{subject}}` | Subject (math, physics, chemistry) |
| `{{topic}}` | Topic within the subject |

### Prompt Priority

1. Subject-specific prompt: `prompts/{subject}/question_generation.txt`
2. Default prompt: `prompts/question_generation.txt`
3. Hardcoded fallback (if no files found)

### Example: Customizing Math Prompts

Edit `backend/prompts/math/question_generation.txt`:

```text
Generate an IB Higher Level Mathematics exam-style question on the topic of {{topic}}.

Requirements:
- Question must match the style and rigor of actual IB HL Mathematics exams
- Include specific numerical values
- Question should be solvable analytically
- Use proper LaTeX notation

The solution_steps field is required because the app displays step-by-step
worked solutions to help students learn the problem-solving process,
similar to IB mark schemes.

Return ONLY valid JSON in this exact format:
{
  "question": "LaTeX code for the question",
  "answer": "LaTeX code for the final answer",
  "solution_steps": [
    {"step": 1, "description": "...", "expression": "..."}
  ],
  "hints": ["hint1", "hint2"]
}
```

Changes take effect on the next API request - no restart required.

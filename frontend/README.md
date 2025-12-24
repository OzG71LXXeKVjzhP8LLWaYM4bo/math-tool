# IB Math Quiz - Frontend

Expo/React Native app for IB Mathematics HL quiz practice.

## Structure

```
app/
├── (tabs)/
│   ├── index.tsx          # Home screen with stats
│   ├── quiz/
│   │   ├── index.tsx      # Quiz selection (new/continue)
│   │   └── [id].tsx       # Quiz player
│   ├── history.tsx        # Quiz history
│   └── progress.tsx       # Progress tracking
├── components/
│   ├── quiz/              # Quiz components
│   ├── latex/             # LaTeX rendering
│   └── input/             # Drawing canvas
├── stores/                # Zustand state
│   ├── quiz-store.ts      # Quiz state
│   ├── progress-store.ts  # Progress state
│   └── settings-store.ts  # App settings
└── services/
    └── api.ts             # Backend API client
```

## Setup

```bash
npm install
npx expo start
```

## Environment

Create `.env` if needed:
```
EXPO_PUBLIC_API_URL=http://localhost:3000/api
```

## Key Components

- **TopicSelector** - Browse IB topics by category
- **QuestionCard** - Display LaTeX questions
- **AnswerInput** - Drawing canvas + text input
- **LatexRenderer** - KaTeX-based LaTeX display

## State Management

Uses Zustand for:
- `useQuizStore` - Active quiz, current question, answers
- `useProgressStore` - Topic progress, quiz history
- `useSettingsStore` - Course selection (AA/AI)

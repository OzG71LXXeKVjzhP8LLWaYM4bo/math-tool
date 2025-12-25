// API Configuration

// Use environment variable or default to localhost for development
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

export const ENDPOINTS = {
  // Health
  health: '/health',

  // OCR
  ocr: '/ocr',

  // Question Generation
  generateQuestion: '/generate-question',

  // Quiz
  quiz: '/quiz',           // POST to create, GET with /:id to fetch
  quizNext: '/quiz/next',
  quizSubmit: '/quiz/submit',
  quizHistory: '/quiz/history',

  // Progress
  progress: '/progress',
  progressTopics: '/progress/topics',
} as const;

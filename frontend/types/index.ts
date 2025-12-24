// API Types

export interface SolutionStep {
  step_number: number;
  description: string;
  expression_latex: string;
}

export interface Question {
  id: string;
  subject: string;
  topic: string;
  subtopic?: string;
  difficulty: number;
  // Multi-part support
  parent_id?: string;
  part_label?: string;
  part_order: number;
  // Content
  question_latex: string;
  answer_latex: string;
  solution_steps: SolutionStep[];
  hints?: string[];
  source: 'generated' | 'ocr' | 'template';
  created_at?: string;
}

export interface Quiz {
  id: string;
  subject: string;
  topic: string;
  question_ids: string[];
  current_index: number;
  started_at?: string;
  completed_at?: string;
}

export interface QuizAnswer {
  question_id: string;
  answer_latex: string;
  is_correct: boolean;
  time_taken: number;
}

export interface Progress {
  id: string;
  subject: string;
  topic: string;
  total_attempts: number;
  correct_answers: number;
  average_difficulty: number;
  current_streak: number;
  mastery_level: number;
  last_activity?: string;
}

export interface TopicProgress {
  subject: string;
  topic: string;
  accuracy: number;
  mastery_level: number;
  streak: number;
}

export interface QuizHistoryItem {
  id: string;
  subject: string;
  topic: string;
  total_questions: number;
  correct_answers: number;
  started_at?: string;
}

// API Request/Response Types

export interface OcrRequest {
  image_base64: string;
}

export interface OcrResponse {
  success: boolean;
  latex?: string;
  confidence: number;
  error?: string;
}

export interface SolveRequest {
  expression_latex: string;
  subject?: string;
  solve_for?: string;
  operation?: 'solve' | 'differentiate' | 'integrate';
}

export interface SolveResponse {
  success: boolean;
  answer_latex: string;
  steps: SolutionStep[];
  error?: string;
}

export interface GenerateQuestionRequest {
  subject: string;
  topic: string;
  difficulty?: number;
  count?: number;
}

export interface GenerateQuestionResponse {
  questions: Question[];
}

export interface QuizNextRequest {
  subject: string;
  topic: string;
  quiz_id?: string;
}

export interface QuizNextResponse {
  question: Question;
  parent_question?: Question;  // For multi-part questions
  quiz_id: string;
  question_number: number;
  total_questions: number;
}

export interface QuizSubmitRequest {
  quiz_id: string;
  question_id: string;
  answer_latex: string;
  time_taken: number;
}

export interface QuizSubmitResponse {
  is_correct: boolean;
  correct_answer: string;
  solution: SolutionStep[];
  next_difficulty: number;
}

// Drawing Types

export interface Point {
  x: number;
  y: number;
}

export interface Stroke {
  id: string;
  points: Point[];
  color: string;
  width: number;
}

export interface CanvasState {
  strokes: Stroke[];
  currentStroke: Stroke | null;
  undoStack: Stroke[][];
  redoStack: Stroke[][];
}

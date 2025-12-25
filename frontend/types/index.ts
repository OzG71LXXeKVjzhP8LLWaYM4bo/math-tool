// API Types

// Session & Paper Types
export type SessionMode = 'quiz' | 'exam';
export type PaperType = 'paper1' | 'paper2' | 'paper3';

export interface QuizConfig {
  mode: SessionMode;
  paperType: PaperType;
  questionCount: number;
}

// Paper type metadata
export const PAPER_INFO: Record<PaperType, {
  name: string;
  duration: string;
  calculator: boolean;
  description: string;
  timePerQuestion: number; // minutes
}> = {
  paper1: {
    name: 'Paper 1',
    duration: '2 hours',
    calculator: false,
    description: 'Pure math, algebraic manipulation, proofs',
    timePerQuestion: 12,
  },
  paper2: {
    name: 'Paper 2',
    duration: '2 hours',
    calculator: true,
    description: 'Real-world modelling, interpretation, statistics',
    timePerQuestion: 12,
  },
  paper3: {
    name: 'Paper 3',
    duration: '1 hour',
    calculator: true,
    description: 'HL investigation, deep reasoning, unfamiliar problems',
    timePerQuestion: 25,
  },
};

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
  name?: string; // Display-friendly name
  question_ids: string[];
  current_index: number;
  started_at?: string;
  completed_at?: string;
  // New fields for quiz/exam mode
  mode?: SessionMode;
  paper_type?: PaperType;
  question_count?: number;
  time_limit?: number; // seconds
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
  name?: string; // Display-friendly name
  total_questions: number;
  correct_answers: number;
  started_at?: string;
  mode?: SessionMode;
  paper_type?: PaperType;
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

export interface GenerateQuestionRequest {
  subject: string;
  topic: string;
  difficulty?: number;
  count?: number;
}

export interface GenerateQuestionResponse {
  questions: Question[];
}

// Request to create a new quiz
export interface CreateQuizRequest {
  subject: string;
  topic: string;
  name?: string;
  mode?: SessionMode;
  paper_type?: PaperType;
  question_count?: number;
}

// Response from quiz creation or retrieval
export interface QuizResponse {
  id: string;
  subject: string;
  topic: string;
  name?: string;
  current_index: number;
  question_count: number;
  mode?: SessionMode;
  paper_type?: PaperType;
  time_limit?: number;
  questions: QuestionWithAnswer[];
}

export interface QuestionWithAnswer {
  question: Question;
  user_answer?: string;
  is_correct?: boolean;
}

export interface QuizNextRequest {
  quiz_id: string;
}

export interface QuizNextResponse {
  question: Question;
  parent_question?: Question;  // For multi-part questions
  quiz_id: string;
  question_number: number;
  total_questions: number;
  // New fields for quiz/exam mode
  mode?: SessionMode;
  paper_type?: PaperType;
  time_limit?: number; // seconds (for exam mode)
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

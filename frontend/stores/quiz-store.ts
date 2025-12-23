import { create } from 'zustand';
import type { Question, QuizSession, QuizAnswer, SolutionStep } from '@/types';
import { api } from '@/services/api';

interface QuizState {
  // Session state
  session: QuizSession | null;
  currentQuestion: Question | null;
  questionNumber: number;
  totalQuestions: number;

  // Answer tracking
  answers: QuizAnswer[];
  lastResult: {
    isCorrect: boolean;
    correctAnswer: string;
    solution: SolutionStep[];
  } | null;

  // UI state
  isLoading: boolean;
  error: string | null;
  showSolution: boolean;

  // Timer
  startTime: number | null;

  // Actions
  startQuiz: (subject: string, topic: string) => Promise<void>;
  fetchNextQuestion: () => Promise<void>;
  submitAnswer: (answerLatex: string) => Promise<void>;
  setShowSolution: (show: boolean) => void;
  resetQuiz: () => void;
}

export const useQuizStore = create<QuizState>((set, get) => ({
  // Initial state
  session: null,
  currentQuestion: null,
  questionNumber: 0,
  totalQuestions: 10,
  answers: [],
  lastResult: null,
  isLoading: false,
  error: null,
  showSolution: false,
  startTime: null,

  startQuiz: async (subject: string, topic: string) => {
    set({ isLoading: true, error: null });

    try {
      const response = await api.getNextQuestion({ subject, topic });

      set({
        session: {
          id: response.session_id,
          subject,
          topic,
          current_index: 1,
        },
        currentQuestion: response.question,
        questionNumber: response.question_number,
        totalQuestions: response.total_questions,
        isLoading: false,
        startTime: Date.now(),
        lastResult: null,
        showSolution: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to start quiz',
      });
    }
  },

  fetchNextQuestion: async () => {
    const { session } = get();
    if (!session) return;

    set({ isLoading: true, error: null });

    try {
      const response = await api.getNextQuestion({
        subject: session.subject,
        topic: session.topic,
        session_id: session.id,
      });

      set({
        currentQuestion: response.question,
        questionNumber: response.question_number,
        totalQuestions: response.total_questions,
        isLoading: false,
        startTime: Date.now(),
        lastResult: null,
        showSolution: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch question',
      });
    }
  },

  submitAnswer: async (answerLatex: string) => {
    const { session, currentQuestion, startTime, answers } = get();
    if (!session || !currentQuestion) return;

    set({ isLoading: true, error: null });

    const timeTaken = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;

    try {
      const response = await api.submitAnswer({
        session_id: session.id,
        question_id: currentQuestion.id,
        answer_latex: answerLatex,
        time_taken: timeTaken,
      });

      const answer: QuizAnswer = {
        question_id: currentQuestion.id,
        answer_latex: answerLatex,
        is_correct: response.is_correct,
        time_taken: timeTaken,
      };

      set({
        answers: [...answers, answer],
        lastResult: {
          isCorrect: response.is_correct,
          correctAnswer: response.correct_answer,
          solution: response.solution,
        },
        isLoading: false,
        showSolution: true,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to submit answer',
      });
    }
  },

  setShowSolution: (show: boolean) => set({ showSolution: show }),

  resetQuiz: () =>
    set({
      session: null,
      currentQuestion: null,
      questionNumber: 0,
      answers: [],
      lastResult: null,
      isLoading: false,
      error: null,
      showSolution: false,
      startTime: null,
    }),
}));

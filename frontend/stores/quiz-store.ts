import { create } from 'zustand';
import type { Question, Quiz, QuizAnswer, SolutionStep, QuizConfig, SessionMode, PaperType } from '@/types';
import { PAPER_INFO } from '@/types';
import { api } from '@/services/api';

interface QuizState {
  // Quiz state
  quiz: Quiz | null;
  currentQuestion: Question | null;
  parentQuestion: Question | null;  // For multi-part questions
  questionNumber: number;
  totalQuestions: number;

  // Quiz/Exam config
  config: QuizConfig | null;

  // Answer tracking
  answers: QuizAnswer[];
  lastResult: {
    isCorrect: boolean;
    correctAnswer: string;
    solution: SolutionStep[];
  } | null;

  // All results (for exam mode - stored until complete)
  allResults: Array<{
    questionId: string;
    isCorrect: boolean;
    correctAnswer: string;
    solution: SolutionStep[];
    userAnswer: string;
  }>;

  // UI state
  isLoading: boolean;
  error: string | null;
  showSolution: boolean;
  isExamComplete: boolean;

  // Timer
  startTime: number | null;
  examStartTime: number | null;
  examTimeLimit: number | null; // seconds

  // Actions
  setConfig: (config: QuizConfig) => void;
  startQuiz: (subject: string, topic: string, name?: string) => Promise<void>;
  resumeQuiz: (quizId: string) => Promise<void>;
  fetchNextQuestion: () => Promise<void>;
  submitAnswer: (answerLatex: string) => Promise<void>;
  setShowSolution: (show: boolean) => void;
  completeExam: () => void;
  resetQuiz: () => void;
  getRemainingTime: () => number | null;
}

export const useQuizStore = create<QuizState>((set, get) => ({
  // Initial state
  quiz: null,
  currentQuestion: null,
  parentQuestion: null,
  questionNumber: 0,
  totalQuestions: 10,
  config: null,
  answers: [],
  lastResult: null,
  allResults: [],
  isLoading: false,
  error: null,
  showSolution: false,
  isExamComplete: false,
  startTime: null,
  examStartTime: null,
  examTimeLimit: null,

  setConfig: (config: QuizConfig) => {
    // Calculate time limit based on paper type and question count
    const paperInfo = PAPER_INFO[config.paperType];
    const timeLimit = config.mode === 'exam'
      ? config.questionCount * paperInfo.timePerQuestion * 60 // Convert minutes to seconds
      : null;

    set({
      config,
      examTimeLimit: timeLimit,
    });
  },

  // Start a NEW quiz - creates quiz and generates first question
  startQuiz: async (subject: string, topic: string, name?: string) => {
    const { config } = get();
    set({ isLoading: true, error: null });

    try {
      // Create a new quiz via POST /api/quiz
      const response = await api.createQuiz({
        subject,
        topic,
        name,
        mode: config?.mode,
        paper_type: config?.paperType,
        question_count: config?.questionCount,
      });

      const now = Date.now();
      const firstQuestion = response.questions[0]?.question;

      set({
        quiz: {
          id: response.id,
          subject: response.subject,
          topic: response.topic,
          name: response.name,
          question_ids: response.questions.map(q => q.question.id),
          current_index: response.current_index,
          mode: response.mode,
          paper_type: response.paper_type,
          question_count: response.question_count,
          time_limit: response.time_limit,
        },
        currentQuestion: firstQuestion || null,
        parentQuestion: null,
        questionNumber: 1,
        totalQuestions: response.question_count,
        isLoading: false,
        startTime: now,
        examStartTime: config?.mode === 'exam' ? now : null,
        examTimeLimit: response.time_limit || null,
        lastResult: null,
        showSolution: false,
        allResults: [],
        isExamComplete: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to start quiz',
      });
    }
  },

  // Resume an EXISTING quiz - fetches existing data without generating new questions
  resumeQuiz: async (quizId: string) => {
    set({ isLoading: true, error: null });

    try {
      // Get existing quiz via GET /api/quiz/:id
      const response = await api.getQuiz(quizId);

      // Find the first unanswered question, or the last one if all answered
      let currentIndex = 0;
      for (let i = 0; i < response.questions.length; i++) {
        if (response.questions[i].user_answer === null || response.questions[i].user_answer === undefined) {
          currentIndex = i;
          break;
        }
        currentIndex = i; // Keep track of last answered
      }

      // If all questions are answered, show the last one
      const currentQ = response.questions[currentIndex];

      // Rebuild answers from response
      const existingAnswers: QuizAnswer[] = response.questions
        .filter(q => q.user_answer !== null && q.user_answer !== undefined)
        .map(q => ({
          question_id: q.question.id,
          answer_latex: q.user_answer!,
          is_correct: q.is_correct ?? false,
          time_taken: 0, // We don't have this info when resuming
        }));

      const now = Date.now();

      set({
        quiz: {
          id: response.id,
          subject: response.subject,
          topic: response.topic,
          name: response.name,
          question_ids: response.questions.map(q => q.question.id),
          current_index: currentIndex,
          mode: response.mode,
          paper_type: response.paper_type,
          question_count: response.question_count,
          time_limit: response.time_limit,
        },
        currentQuestion: currentQ?.question || null,
        parentQuestion: null,
        questionNumber: currentIndex + 1,
        totalQuestions: response.question_count,
        answers: existingAnswers,
        isLoading: false,
        startTime: now,
        examStartTime: response.mode === 'exam' ? now : null,
        examTimeLimit: response.time_limit || null,
        lastResult: null,
        showSolution: false,
        allResults: [],
        isExamComplete: false,
        config: response.mode ? {
          mode: response.mode as SessionMode,
          paperType: (response.paper_type || 'paper1') as PaperType,
          questionCount: response.question_count,
        } : null,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to resume quiz',
      });
    }
  },

  fetchNextQuestion: async () => {
    const { quiz } = get();
    if (!quiz) return;

    set({ isLoading: true, error: null });

    try {
      const response = await api.getNextQuestion(quiz.id);

      set({
        currentQuestion: response.question,
        parentQuestion: response.parent_question || null,
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
    const { quiz, currentQuestion, startTime, answers, config, allResults } = get();
    if (!quiz || !currentQuestion) return;

    set({ isLoading: true, error: null });

    const timeTaken = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
    const isExamMode = config?.mode === 'exam';

    try {
      const response = await api.submitAnswer({
        quiz_id: quiz.id,
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

      // Store result for exam mode review
      const newResult = {
        questionId: currentQuestion.id,
        isCorrect: response.is_correct,
        correctAnswer: response.correct_answer,
        solution: response.solution,
        userAnswer: answerLatex,
      };

      if (isExamMode) {
        // In exam mode, don't show solution immediately
        set({
          answers: [...answers, answer],
          allResults: [...allResults, newResult],
          lastResult: null,
          isLoading: false,
          showSolution: false,
        });
      } else {
        // In quiz mode, show solution after each question
        set({
          answers: [...answers, answer],
          allResults: [...allResults, newResult],
          lastResult: {
            isCorrect: response.is_correct,
            correctAnswer: response.correct_answer,
            solution: response.solution,
          },
          isLoading: false,
          showSolution: true,
        });
      }
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to submit answer',
      });
    }
  },

  setShowSolution: (show: boolean) => set({ showSolution: show }),

  completeExam: () => {
    set({ isExamComplete: true });
  },

  getRemainingTime: () => {
    const { examStartTime, examTimeLimit } = get();
    if (!examStartTime || !examTimeLimit) return null;

    const elapsed = Math.floor((Date.now() - examStartTime) / 1000);
    const remaining = examTimeLimit - elapsed;
    return Math.max(0, remaining);
  },

  resetQuiz: () =>
    set({
      quiz: null,
      currentQuestion: null,
      parentQuestion: null,
      questionNumber: 0,
      config: null,
      answers: [],
      lastResult: null,
      allResults: [],
      isLoading: false,
      error: null,
      showSolution: false,
      isExamComplete: false,
      startTime: null,
      examStartTime: null,
      examTimeLimit: null,
    }),
}));

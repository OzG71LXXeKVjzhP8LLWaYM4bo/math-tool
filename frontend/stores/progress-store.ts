import { create } from 'zustand';
import type { Progress, TopicProgress, QuizHistoryItem } from '@/types';
import { api } from '@/services/api';

interface ProgressState {
  // Data
  progress: Progress[];
  topicProgress: TopicProgress[];
  quizHistory: QuizHistoryItem[];

  // UI state
  isLoading: boolean;
  isLoadingHistory: boolean;
  error: string | null;

  // Actions
  fetchProgress: (subject?: string, topic?: string) => Promise<void>;
  fetchTopicProgress: () => Promise<void>;
  fetchQuizHistory: () => Promise<void>;
  refreshAll: () => Promise<void>;
}

export const useProgressStore = create<ProgressState>((set, get) => ({
  // Initial state
  progress: [],
  topicProgress: [],
  quizHistory: [],
  isLoading: false,
  isLoadingHistory: false,
  error: null,

  fetchProgress: async (subject?: string, topic?: string) => {
    set({ isLoading: true, error: null });

    try {
      const response = await api.getProgress(subject, topic);
      set({ progress: response.progress, isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch progress',
      });
    }
  },

  fetchTopicProgress: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await api.getTopicProgress();
      set({ topicProgress: response, isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch topic progress',
      });
    }
  },

  fetchQuizHistory: async () => {
    set({ isLoadingHistory: true });
    try {
      const history = await api.getQuizHistory();
      set({ quizHistory: history, isLoadingHistory: false });
    } catch (error) {
      console.error('Failed to fetch quiz history:', error);
      set({ isLoadingHistory: false, error: error instanceof Error ? error.message : 'Failed to fetch history' });
    }
  },

  refreshAll: async () => {
    const { fetchProgress, fetchTopicProgress, fetchQuizHistory } = get();
    await Promise.all([fetchProgress(), fetchTopicProgress(), fetchQuizHistory()]);
  },
}));

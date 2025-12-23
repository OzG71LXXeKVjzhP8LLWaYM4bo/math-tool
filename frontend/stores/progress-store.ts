import { create } from 'zustand';
import type { Progress, TopicProgress } from '@/types';
import { api } from '@/services/api';

interface ProgressState {
  // Data
  progress: Progress[];
  topicProgress: TopicProgress[];

  // UI state
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchProgress: (subject?: string, topic?: string) => Promise<void>;
  fetchTopicProgress: () => Promise<void>;
  refreshAll: () => Promise<void>;
}

export const useProgressStore = create<ProgressState>((set, get) => ({
  // Initial state
  progress: [],
  topicProgress: [],
  isLoading: false,
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

  refreshAll: async () => {
    const { fetchProgress, fetchTopicProgress } = get();
    await Promise.all([fetchProgress(), fetchTopicProgress()]);
  },
}));

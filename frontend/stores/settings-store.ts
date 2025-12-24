import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Course = 'aa' | 'ai';

interface SettingsState {
  // Selected IB Math course
  course: Course | null;

  // Actions
  setCourse: (course: Course) => void;
  hasCourseSelected: () => boolean;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      course: null,

      setCourse: (course: Course) => set({ course }),

      hasCourseSelected: () => get().course !== null,
    }),
    {
      name: 'ib-math-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export const COURSE_NAMES: Record<Course, string> = {
  aa: 'Analysis & Approaches',
  ai: 'Applications & Interpretation',
};

export const COURSE_SHORT_NAMES: Record<Course, string> = {
  aa: 'Math AA',
  ai: 'Math AI',
};

export const COURSE_DESCRIPTIONS: Record<Course, string> = {
  aa: 'Focus on algebraic methods, proofs, and abstract reasoning',
  ai: 'Focus on real-world applications, modeling, and technology',
};

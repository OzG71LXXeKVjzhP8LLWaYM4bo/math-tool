import { create } from 'zustand';
import type { Stroke, Point } from '@/types';

interface CanvasStore {
  // State
  strokes: Stroke[];
  currentStroke: Stroke | null;
  undoStack: Stroke[][];
  redoStack: Stroke[][];

  // Drawing settings
  currentColor: string;
  strokeWidth: number;
  tool: 'pen' | 'eraser' | 'highlighter';

  // Actions
  startStroke: (point: Point) => void;
  addPoint: (point: Point) => void;
  endStroke: () => void;
  undo: () => void;
  redo: () => void;
  clear: () => void;
  setColor: (color: string) => void;
  setStrokeWidth: (width: number) => void;
  setTool: (tool: 'pen' | 'eraser' | 'highlighter') => void;
  getCanvasData: () => Stroke[];
}

const generateId = () => Math.random().toString(36).substring(2, 9);

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  // Initial state
  strokes: [],
  currentStroke: null,
  undoStack: [],
  redoStack: [],
  currentColor: '#000000',
  strokeWidth: 3,
  tool: 'pen',

  startStroke: (point: Point) => {
    const { currentColor, strokeWidth, tool } = get();

    const stroke: Stroke = {
      id: generateId(),
      points: [point],
      color: tool === 'eraser' ? '#FFFFFF' : currentColor,
      width: tool === 'eraser' ? strokeWidth * 3 : strokeWidth,
    };

    set({ currentStroke: stroke });
  },

  addPoint: (point: Point) => {
    const { currentStroke } = get();
    if (!currentStroke) return;

    set({
      currentStroke: {
        ...currentStroke,
        points: [...currentStroke.points, point],
      },
    });
  },

  endStroke: () => {
    const { currentStroke, strokes, undoStack } = get();
    if (!currentStroke || currentStroke.points.length < 2) {
      set({ currentStroke: null });
      return;
    }

    set({
      strokes: [...strokes, currentStroke],
      currentStroke: null,
      undoStack: [...undoStack, strokes],
      redoStack: [], // Clear redo stack on new action
    });
  },

  undo: () => {
    const { strokes, undoStack, redoStack } = get();
    if (undoStack.length === 0) return;

    const previousState = undoStack[undoStack.length - 1];

    set({
      strokes: previousState,
      undoStack: undoStack.slice(0, -1),
      redoStack: [...redoStack, strokes],
    });
  },

  redo: () => {
    const { strokes, undoStack, redoStack } = get();
    if (redoStack.length === 0) return;

    const nextState = redoStack[redoStack.length - 1];

    set({
      strokes: nextState,
      undoStack: [...undoStack, strokes],
      redoStack: redoStack.slice(0, -1),
    });
  },

  clear: () => {
    const { strokes, undoStack } = get();
    if (strokes.length === 0) return;

    set({
      strokes: [],
      currentStroke: null,
      undoStack: [...undoStack, strokes],
      redoStack: [],
    });
  },

  setColor: (color: string) => set({ currentColor: color }),

  setStrokeWidth: (width: number) => set({ strokeWidth: width }),

  setTool: (tool: 'pen' | 'eraser' | 'highlighter') => set({ tool }),

  getCanvasData: () => get().strokes,
}));

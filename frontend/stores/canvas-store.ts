import { create } from 'zustand';

export interface Point {
  x: number;
  y: number;
}

export interface Stroke {
  points: Point[];
  color: string;
  width: number;
  tool: 'pen' | 'eraser';
}

interface CanvasState {
  strokes: Stroke[];
  currentStroke: Stroke | null;
  undoStack: Stroke[][];
  redoStack: Stroke[][];
  currentColor: string;
  strokeWidth: number;
  tool: 'pen' | 'eraser';

  startStroke: (point: Point) => void;
  addPoint: (point: Point) => void;
  endStroke: () => void;
  undo: () => void;
  redo: () => void;
  clear: () => void;
  setColor: (color: string) => void;
  setStrokeWidth: (width: number) => void;
  setTool: (tool: 'pen' | 'eraser') => void;
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  strokes: [],
  currentStroke: null,
  undoStack: [],
  redoStack: [],
  currentColor: '#000000',
  strokeWidth: 3,
  tool: 'pen',

  startStroke: (point: Point) => {
    const { currentColor, strokeWidth, tool } = get();
    set({
      currentStroke: {
        points: [point],
        color: tool === 'eraser' ? '#FFFFFF' : currentColor,
        width: tool === 'eraser' ? 20 : strokeWidth,
        tool,
      },
    });
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
      redoStack: [],
    });
  },

  undo: () => {
    const { strokes, undoStack, redoStack } = get();
    if (undoStack.length === 0) return;

    const previousStrokes = undoStack[undoStack.length - 1];
    set({
      strokes: previousStrokes,
      undoStack: undoStack.slice(0, -1),
      redoStack: [...redoStack, strokes],
    });
  },

  redo: () => {
    const { strokes, undoStack, redoStack } = get();
    if (redoStack.length === 0) return;

    const nextStrokes = redoStack[redoStack.length - 1];
    set({
      strokes: nextStrokes,
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
  setTool: (tool: 'pen' | 'eraser') => set({ tool }),
}));

import { create } from 'zustand';

// Maximum strokes to keep in memory (per spec: 500-1000)
const MAX_STROKES = 500;

// Eraser hit-test radius
const ERASER_RADIUS = 15;

export interface Point {
  x: number;
  y: number;
  t?: number;      // timestamp (ms)
  force?: number;  // pressure (0-1, optional for stylus)
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
  resetTransform?: () => void;

  // Low-latency: add completed stroke directly (used by DrawingCanvas)
  addStroke: (stroke: Stroke) => void;
  // Legacy per-point API (kept for compatibility)
  startStroke: (point: Point) => void;
  addPoint: (point: Point) => void;
  endStroke: () => void;
  eraseAt: (point: Point) => void;
  undo: () => void;
  redo: () => void;
  clear: () => void;
  setColor: (color: string) => void;
  setStrokeWidth: (width: number) => void;
  setTool: (tool: 'pen' | 'eraser') => void;
}

// Check if a point is within radius of any point in a stroke
const strokeIntersectsPoint = (
  stroke: Stroke,
  point: Point,
  radius: number
): boolean => {
  for (const p of stroke.points) {
    const dx = p.x - point.x;
    const dy = p.y - point.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance <= radius) {
      return true;
    }
  }
  return false;
};

export const useCanvasStore = create<CanvasState>((set, get) => ({
  strokes: [],
  currentStroke: null,
  undoStack: [],
  redoStack: [],
  currentColor: '#000000',
  strokeWidth: 3,
  tool: 'pen',

  // Low-latency: add a complete stroke (called once per stroke from DrawingCanvas)
  addStroke: (stroke: Stroke) => {
    const { strokes, undoStack } = get();
    if (stroke.points.length < 1) return;  // Allow single-point strokes (dots)

    // Apply memory limit
    let newStrokes = [...strokes, stroke];
    if (newStrokes.length > MAX_STROKES) {
      newStrokes = newStrokes.slice(-MAX_STROKES);
    }

    set({
      strokes: newStrokes,
      undoStack: [...undoStack, strokes],
      redoStack: [],
    });
  },

  startStroke: (point: Point) => {
    const { currentColor, strokeWidth, tool } = get();
    // Add timestamp if not provided
    const pointWithTime = {
      ...point,
      t: point.t ?? Date.now(),
    };
    set({
      currentStroke: {
        points: [pointWithTime],
        color: currentColor,
        width: strokeWidth,
        tool,
      },
    });
  },

  addPoint: (point: Point) => {
    const { currentStroke } = get();
    if (!currentStroke) return;

    // Add timestamp if not provided
    const pointWithTime = {
      ...point,
      t: point.t ?? Date.now(),
    };

    set({
      currentStroke: {
        ...currentStroke,
        points: [...currentStroke.points, pointWithTime],
      },
    });
  },

  endStroke: () => {
    const { currentStroke, strokes, undoStack } = get();
    if (!currentStroke || currentStroke.points.length < 2) {
      set({ currentStroke: null });
      return;
    }

    // Apply memory limit - keep only last MAX_STROKES
    let newStrokes = [...strokes, currentStroke];
    if (newStrokes.length > MAX_STROKES) {
      newStrokes = newStrokes.slice(-MAX_STROKES);
    }

    set({
      strokes: newStrokes,
      currentStroke: null,
      undoStack: [...undoStack, strokes],
      redoStack: [],
    });
  },

  eraseAt: (point: Point) => {
    const { strokes, undoStack } = get();

    // Find strokes that intersect with the eraser point
    const remainingStrokes = strokes.filter(
      (stroke) => !strokeIntersectsPoint(stroke, point, ERASER_RADIUS)
    );

    // Only update if something was erased
    if (remainingStrokes.length !== strokes.length) {
      set({
        strokes: remainingStrokes,
        undoStack: [...undoStack, strokes],
        redoStack: [],
      });
    }
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

import React, { forwardRef, useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { View, StyleSheet, LayoutChangeEvent, Text } from 'react-native';
import {
  Canvas,
  Path,
  Skia,
  Group,
  useCanvasRef,
  SkPath,
} from '@shopify/react-native-skia';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
  PointerType,
} from 'react-native-gesture-handler';
import Animated, { useSharedValue, useDerivedValue, runOnJS, useAnimatedReaction } from 'react-native-reanimated';
import { useCanvasStore, type Point } from '@/stores/canvas-store';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { FloatingToolbar } from './CanvasToolbar';

// Constants for scale limits
const MIN_SCALE = 0.1;
const MAX_SCALE = 10;

interface DrawingCanvasProps {
  width?: number;
  height?: number;
  showGrid?: boolean;
  flexFill?: boolean;
  showToolbar?: boolean;
  onCanvasReady?: (canvasRef: ReturnType<typeof useCanvasRef>) => void;
}

// Validate that a point has finite coordinates
const isValidPoint = (p: { x: number; y: number }): boolean =>
  Number.isFinite(p.x) && Number.isFinite(p.y);

// Safe scale clamping to prevent division by zero/infinity
const clampScale = (s: number): number => Math.max(0.1, Math.min(s, 10));

export const DrawingCanvas = forwardRef<View, DrawingCanvasProps>(
  ({ height = 250, showGrid = true, flexFill = false, showToolbar = true, onCanvasReady }, ref) => {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const [canvasWidth, setCanvasWidth] = useState(300);
    const [canvasHeight, setCanvasHeight] = useState(height);
    const canvasRef = useCanvasRef();

    // Get store state and actions
    const strokes = useCanvasStore((s) => s.strokes);
    const addStroke = useCanvasStore((s) => s.addStroke);
    const tool = useCanvasStore((s) => s.tool);
    const eraseAt = useCanvasStore((s) => s.eraseAt);
    const currentColor = useCanvasStore((s) => s.currentColor);
    const strokeWidth = useCanvasStore((s) => s.strokeWidth);

    // Refs to access current stroke settings in callbacks
    const colorRef = useRef(currentColor);
    const widthRef = useRef(strokeWidth);
    useEffect(() => { colorRef.current = currentColor; }, [currentColor]);
    useEffect(() => { widthRef.current = strokeWidth; }, [strokeWidth]);

    // ============ LOW-LATENCY DRAWING ============
    // Current stroke points stored in shared value (UI thread only)
    // This eliminates runOnJS per-point and React re-renders during drawing
    const currentPoints = useSharedValue<{ x: number; y: number }[]>([]);
    const isDrawing = useSharedValue(false);
    // Trigger re-render when points change (for Skia path update)
    const pointsVersion = useSharedValue(0);

    // Transform state using shared values for gestures
    const scale = useSharedValue(1);
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const savedScale = useSharedValue(1);
    const savedTranslateX = useSharedValue(0);
    const savedTranslateY = useSharedValue(0);

    // React state for rendering (synced from shared values)
    const [transform, setTransform] = useState({
      scale: 1,
      translateX: 0,
      translateY: 0,
    });

    // Track current path for rendering (updated by animation reaction)
    const [currentPath, setCurrentPath] = useState<{ path: SkPath; color: string; width: number; isDot?: boolean } | null>(null);

    // Ref to always have current transform (avoids stale closures)
    const transformRef = useRef(transform);
    useEffect(() => {
      transformRef.current = transform;
    }, [transform]);

    // Safe scale for rendering (prevents division by zero)
    const safeScale = clampScale(transform.scale);

    // Build Skia path from points (called on JS thread when points change)
    const buildCurrentPath = useCallback(() => {
      const points = currentPoints.value;
      if (points.length === 0) {
        setCurrentPath(null);
        return;
      }

      const path = Skia.Path.Make();
      const width = widthRef.current;

      // Handle single point (dot) - draw as filled circle
      if (points.length === 1) {
        const p = points[0];
        path.addCircle(p.x, p.y, width / 2);
        setCurrentPath({
          path,
          color: colorRef.current,
          width,
          isDot: true,
        });
        return;
      }

      // Handle 2 points - simple line
      if (points.length === 2) {
        path.moveTo(points[0].x, points[0].y);
        path.lineTo(points[1].x, points[1].y);
        setCurrentPath({
          path,
          color: colorRef.current,
          width,
        });
        return;
      }

      // 3+ points - smooth quadratic curves
      path.moveTo(points[0].x, points[0].y);

      for (let i = 1; i < points.length - 1; i++) {
        const midX = (points[i].x + points[i + 1].x) / 2;
        const midY = (points[i].y + points[i + 1].y) / 2;
        path.quadTo(points[i].x, points[i].y, midX, midY);
      }

      const last = points[points.length - 1];
      path.lineTo(last.x, last.y);

      setCurrentPath({
        path,
        color: colorRef.current,
        width,
      });
    }, []);

    // React to points version changes to rebuild path
    useAnimatedReaction(
      () => pointsVersion.value,
      (version, prevVersion) => {
        if (version !== prevVersion) {
          runOnJS(buildCurrentPath)();
        }
      },
      []
    );

    // Sync transform to React state for rendering
    const syncTransform = useCallback(() => {
      const newScale = clampScale(scale.value);
      setTransform({
        scale: newScale,
        translateX: translateX.value,
        translateY: translateY.value,
      });
    }, []);

    // Continuously sync transform during gestures for smooth pan/zoom
    useAnimatedReaction(
      () => ({
        s: scale.value,
        tx: translateX.value,
        ty: translateY.value,
      }),
      (current, previous) => {
        if (
          !previous ||
          current.s !== previous.s ||
          current.tx !== previous.tx ||
          current.ty !== previous.ty
        ) {
          runOnJS(setTransform)({
            scale: Math.max(MIN_SCALE, Math.min(current.s, MAX_SCALE)),
            translateX: current.tx,
            translateY: current.ty,
          });
        }
      },
      []
    );

    // Notify parent when canvas is ready
    useEffect(() => {
      if (onCanvasReady && canvasRef) {
        onCanvasReady(canvasRef);
      }
    }, [canvasRef, onCanvasReady]);

    // Reset transform function exposed to toolbar
    const resetTransform = useCallback(() => {
      scale.value = 1;
      translateX.value = 0;
      translateY.value = 0;
      setTransform({ scale: 1, translateX: 0, translateY: 0 });
    }, []);

    // Expose reset function via store
    useEffect(() => {
      useCanvasStore.setState({ resetTransform });
    }, [resetTransform]);

    const handleLayout = useCallback((event: LayoutChangeEvent) => {
      const { width, height: layoutHeight } = event.nativeEvent.layout;
      setCanvasWidth(width);
      if (flexFill) {
        setCanvasHeight(layoutHeight);
      }
    }, [flexFill]);

    const effectiveHeight = flexFill ? canvasHeight : height;

    const bgColor = isDark ? '#1A1A1A' : '#FFFFFF';
    const gridColor = isDark ? '#333333' : '#E8E8E8';
    const borderColor = isDark ? '#444444' : '#CCCCCC';

    // Finalize stroke - called once per stroke on JS thread
    const finalizeStroke = useCallback((points: { x: number; y: number }[]) => {
      if (points.length < 1) return;

      // Convert to Point[] with timestamps
      const strokePoints: Point[] = points.map((p, i) => ({
        x: p.x,
        y: p.y,
        t: Date.now() - (points.length - i), // Approximate timestamps
      }));

      // Add to Zustand store (single React render)
      addStroke({
        points: strokePoints,
        color: colorRef.current,
        width: widthRef.current,
        tool: 'pen',
      });

      // Clear current path
      setCurrentPath(null);
    }, [addStroke]);

    // Handle eraser on JS thread
    const handleErase = useCallback((x: number, y: number) => {
      const t = transformRef.current;
      const s = clampScale(t.scale);
      const point = {
        x: (x - t.translateX) / s,
        y: (y - t.translateY) / s,
      };
      eraseAt(point);
    }, [eraseAt]);

    // Shared value to track tool on UI thread
    const isEraserMode = useSharedValue(tool === 'eraser');
    useEffect(() => {
      isEraserMode.value = tool === 'eraser';
    }, [tool]);

    // ============ STYLUS-ONLY DRAWING ============
    // Stylus (S Pen) → draws/erases
    // Finger → pans (1 finger) or zooms (2 fingers / pinch)

    // Stylus tap gesture for dots (quick stylus taps)
    const stylusTapGesture = useMemo(() =>
      Gesture.Tap()
        .onEnd((e) => {
          'worklet';
          // Only respond to stylus input
          if (e.pointerType !== PointerType.STYLUS) return;

          if (isEraserMode.value) {
            runOnJS(handleErase)(e.x, e.y);
            return;
          }

          // Transform coordinates on UI thread
          const s = Math.max(MIN_SCALE, Math.min(scale.value, MAX_SCALE));
          const x = (e.x - translateX.value) / s;
          const y = (e.y - translateY.value) / s;

          // Create single-point stroke (dot)
          currentPoints.value = [{ x, y }];
          pointsVersion.value = pointsVersion.value + 1;

          // Immediately finalize as a dot
          runOnJS(finalizeStroke)([{ x, y }]);
        }),
    [handleErase, finalizeStroke]);

    // Stylus pan gesture for drawing - LOW LATENCY VERSION
    const stylusPanGesture = useMemo(() =>
      Gesture.Pan()
        .minDistance(0)  // No minimum distance - register immediately
        .minPointers(1)
        .maxPointers(1)
        .onStart((e) => {
          'worklet';
          // Only respond to stylus input
          if (e.pointerType !== PointerType.STYLUS) return;

          if (isEraserMode.value) {
            runOnJS(handleErase)(e.x, e.y);
            return;
          }

          // Transform coordinates on UI thread (no runOnJS!)
          const s = Math.max(MIN_SCALE, Math.min(scale.value, MAX_SCALE));
          const x = (e.x - translateX.value) / s;
          const y = (e.y - translateY.value) / s;

          // Start new stroke in shared value
          currentPoints.value = [{ x, y }];
          isDrawing.value = true;
          pointsVersion.value = pointsVersion.value + 1;
        })
        .onUpdate((e) => {
          'worklet';
          // Only respond to stylus input
          if (e.pointerType !== PointerType.STYLUS) return;

          if (isEraserMode.value) {
            runOnJS(handleErase)(e.x, e.y);
            return;
          }

          if (!isDrawing.value) return;

          // Transform coordinates on UI thread
          const s = Math.max(MIN_SCALE, Math.min(scale.value, MAX_SCALE));
          const x = (e.x - translateX.value) / s;
          const y = (e.y - translateY.value) / s;

          // Append point to shared value (stays on UI thread)
          currentPoints.value = [...currentPoints.value, { x, y }];
          pointsVersion.value = pointsVersion.value + 1;
        })
        .onEnd((e) => {
          'worklet';
          // Only respond to stylus input
          if (e.pointerType !== PointerType.STYLUS) return;

          if (isEraserMode.value) return;

          if (!isDrawing.value) return;
          isDrawing.value = false;

          // Only NOW sync to JS thread (once per stroke)
          const points = currentPoints.value;
          currentPoints.value = [];
          runOnJS(finalizeStroke)(points);
        }),
    [handleErase, finalizeStroke]);

    // Combine stylus tap and pan for drawing
    const stylusDrawGesture = useMemo(() =>
      Gesture.Race(stylusTapGesture, stylusPanGesture),
    [stylusTapGesture, stylusPanGesture]);

    // ============ FINGER GESTURES (PAN/ZOOM) ============

    // Single finger pan for canvas movement (touch only)
    const fingerPanGesture = useMemo(() =>
      Gesture.Pan()
        .minPointers(1)
        .maxPointers(1)
        .onStart((e) => {
          'worklet';
          // Only respond to touch (finger) input
          if (e.pointerType !== PointerType.TOUCH) return;

          savedTranslateX.value = translateX.value;
          savedTranslateY.value = translateY.value;
        })
        .onUpdate((e) => {
          'worklet';
          // Only respond to touch (finger) input
          if (e.pointerType !== PointerType.TOUCH) return;

          translateX.value = savedTranslateX.value + e.translationX;
          translateY.value = savedTranslateY.value + e.translationY;
        })
        .onEnd((e) => {
          'worklet';
          // Only respond to touch (finger) input
          if (e.pointerType !== PointerType.TOUCH) return;

          runOnJS(syncTransform)();
        }),
    [syncTransform]);

    // Pinch gesture for zoom (2 fingers)
    const pinchGesture = useMemo(() =>
      Gesture.Pinch()
        .onStart(() => {
          'worklet';
          savedScale.value = scale.value;
        })
        .onUpdate((e) => {
          'worklet';
          // Clamp scale on UI thread using inline math (no JS function call)
          const newScale = savedScale.value * e.scale;
          scale.value = Math.max(MIN_SCALE, Math.min(newScale, MAX_SCALE));
        })
        .onEnd(() => {
          'worklet';
          runOnJS(syncTransform)();
        }),
    [syncTransform]);

    // Two-finger pan for canvas movement (works alongside pinch)
    const twoFingerPan = useMemo(() =>
      Gesture.Pan()
        .minPointers(2)
        .onStart(() => {
          'worklet';
          savedTranslateX.value = translateX.value;
          savedTranslateY.value = translateY.value;
        })
        .onUpdate((e) => {
          'worklet';
          translateX.value = savedTranslateX.value + e.translationX;
          translateY.value = savedTranslateY.value + e.translationY;
        })
        .onEnd(() => {
          'worklet';
          runOnJS(syncTransform)();
        }),
    [syncTransform]);

    // Combine pinch and two-finger pan (simultaneous for zoom+pan)
    const zoomPanGesture = useMemo(() =>
      Gesture.Simultaneous(pinchGesture, twoFingerPan),
    [pinchGesture, twoFingerPan]);

    // ============ COMPOSED GESTURE ============
    // All gestures run simultaneously - pointerType filtering handles separation
    // - Stylus → drawing (stylusDrawGesture)
    // - 1 finger → pan (fingerPanGesture)
    // - 2 fingers → zoom+pan (zoomPanGesture)
    const composedGesture = useMemo(() =>
      Gesture.Simultaneous(stylusDrawGesture, fingerPanGesture, zoomPanGesture),
    [stylusDrawGesture, fingerPanGesture, zoomPanGesture]);

    // Convert points to Skia path with validation
    const pointsToSkiaPath = useCallback((points: { x: number; y: number }[], width: number): SkPath | null => {
      if (!points || points.length < 1) return null;
      if (!isValidPoint(points[0])) return null;

      const path = Skia.Path.Make();

      // Single point - draw as circle (dot)
      if (points.length === 1) {
        path.addCircle(points[0].x, points[0].y, width / 2);
        return path;
      }

      // Two points - simple line
      if (points.length === 2) {
        path.moveTo(points[0].x, points[0].y);
        if (isValidPoint(points[1])) {
          path.lineTo(points[1].x, points[1].y);
        }
        return path;
      }

      // 3+ points - smooth curves
      path.moveTo(points[0].x, points[0].y);

      for (let i = 1; i < points.length - 1; i++) {
        if (!isValidPoint(points[i]) || !isValidPoint(points[i + 1])) continue;
        const midX = (points[i].x + points[i + 1].x) / 2;
        const midY = (points[i].y + points[i + 1].y) / 2;
        path.quadTo(points[i].x, points[i].y, midX, midY);
      }

      const last = points[points.length - 1];
      if (isValidPoint(last)) {
        path.lineTo(last.x, last.y);
      }

      return path;
    }, []);

    // Grid path
    const gridPath = useMemo(() => {
      if (!showGrid) return null;

      const path = Skia.Path.Make();
      const gridSpacing = 25;
      const extendFactor = 3;
      const extendedWidth = canvasWidth * extendFactor;
      const extendedHeight = effectiveHeight * extendFactor;
      const offsetX = -canvasWidth;
      const offsetY = -effectiveHeight;

      // Vertical lines
      for (let x = offsetX; x < extendedWidth + offsetX; x += gridSpacing) {
        path.moveTo(x, offsetY);
        path.lineTo(x, extendedHeight + offsetY);
      }

      // Horizontal lines
      for (let y = offsetY; y < extendedHeight + offsetY; y += gridSpacing) {
        path.moveTo(offsetX, y);
        path.lineTo(extendedWidth + offsetX, y);
      }

      return path;
    }, [showGrid, canvasWidth, effectiveHeight]);

    // Memoize stroke paths (completed strokes from Zustand)
    const strokePaths = useMemo(() => {
      return strokes.map((stroke) => ({
        path: pointsToSkiaPath(stroke.points, stroke.width),
        color: stroke.color,
        width: stroke.width,
        isDot: stroke.points.length === 1,
      }));
    }, [strokes, pointsToSkiaPath]);

    // Note: currentPath is now managed via useState + useAnimatedReaction
    // for low-latency drawing (see buildCurrentPath above)

    return (
      <GestureHandlerRootView style={flexFill ? styles.flexContainer : undefined}>
        <View
          ref={ref}
          style={[
            styles.container,
            flexFill && styles.flexContainer,
            {
              height: flexFill ? undefined : height,
              backgroundColor: bgColor,
              borderColor,
            },
          ]}
          onLayout={handleLayout}
        >
          <GestureDetector gesture={composedGesture}>
            <Animated.View style={{ flex: 1 }}>
              <Canvas
                ref={canvasRef}
                style={{ width: canvasWidth, height: effectiveHeight }}
              >
                {/* Apply transform group for pan/zoom */}
                <Group
                  transform={[
                    { translateX: transform.translateX },
                    { translateY: transform.translateY },
                    { scale: safeScale },
                  ]}
                >
                  {/* Grid */}
                  {gridPath && (
                    <Path
                      path={gridPath}
                      color={gridColor}
                      style="stroke"
                      strokeWidth={0.5 / safeScale}
                    />
                  )}

                  {/* Completed strokes */}
                  {strokePaths.map((strokeData, index) => {
                    if (!strokeData.path) return null;
                    // Dots (single points) are drawn as filled circles
                    if (strokeData.isDot) {
                      return (
                        <Path
                          key={index}
                          path={strokeData.path}
                          color={strokeData.color}
                          style="fill"
                        />
                      );
                    }
                    return (
                      <Path
                        key={index}
                        path={strokeData.path}
                        color={strokeData.color}
                        style="stroke"
                        strokeWidth={strokeData.width / safeScale}
                        strokeCap="round"
                        strokeJoin="round"
                      />
                    );
                  })}

                  {/* Current stroke being drawn */}
                  {currentPath && currentPath.path && (
                    currentPath.isDot ? (
                      <Path
                        path={currentPath.path}
                        color={currentPath.color}
                        style="fill"
                      />
                    ) : (
                      <Path
                        path={currentPath.path}
                        color={currentPath.color}
                        style="stroke"
                        strokeWidth={currentPath.width / safeScale}
                        strokeCap="round"
                        strokeJoin="round"
                      />
                    )
                  )}
                </Group>
              </Canvas>
            </Animated.View>
          </GestureDetector>

          {/* Zoom indicator */}
          {transform.scale !== 1 && (
            <View style={styles.zoomIndicator}>
              <View style={[styles.zoomBadge, { backgroundColor: isDark ? '#333' : '#EEE' }]}>
                <Text style={[styles.zoomText, { color: isDark ? '#FFF' : '#333' }]}>
                  {Math.round(transform.scale * 100)}%
                </Text>
              </View>
            </View>
          )}

          {/* Floating toolbar */}
          {showToolbar && <FloatingToolbar />}
        </View>
      </GestureHandlerRootView>
    );
  }
);

DrawingCanvas.displayName = 'DrawingCanvas';

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  flexContainer: {
    flex: 1,
  },
  zoomIndicator: {
    position: 'absolute',
    bottom: 8,
    right: 8,
  },
  zoomBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  zoomText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

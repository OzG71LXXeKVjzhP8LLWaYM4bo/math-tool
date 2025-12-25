import React, { forwardRef, useState, useMemo, useCallback, useRef } from 'react';
import { View, StyleSheet, LayoutChangeEvent, PanResponder, Text, GestureResponderEvent } from 'react-native';
import Svg, { Path, G } from 'react-native-svg';
import { useCanvasStore } from '@/stores/canvas-store';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface DrawingCanvasProps {
  width?: number;
  height?: number;
  showGrid?: boolean;
  flexFill?: boolean;
}

interface Transform {
  scale: number;
  translateX: number;
  translateY: number;
}

// Get distance between two touch points
const getDistance = (touches: { pageX: number; pageY: number }[]) => {
  if (touches.length < 2) return 0;
  const dx = touches[0].pageX - touches[1].pageX;
  const dy = touches[0].pageY - touches[1].pageY;
  return Math.sqrt(dx * dx + dy * dy);
};

// Get center point between two touches
const getCenter = (touches: { pageX: number; pageY: number }[]) => {
  if (touches.length < 2) return { x: 0, y: 0 };
  return {
    x: (touches[0].pageX + touches[1].pageX) / 2,
    y: (touches[0].pageY + touches[1].pageY) / 2,
  };
};

export const DrawingCanvas = forwardRef<View, DrawingCanvasProps>(
  ({ height = 250, showGrid = true, flexFill = false }, ref) => {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const [canvasWidth, setCanvasWidth] = useState(300);
    const [canvasHeight, setCanvasHeight] = useState(height);

    const strokes = useCanvasStore((s) => s.strokes);
    const currentStroke = useCanvasStore((s) => s.currentStroke);
    const startStroke = useCanvasStore((s) => s.startStroke);
    const addPoint = useCanvasStore((s) => s.addPoint);
    const endStroke = useCanvasStore((s) => s.endStroke);
    const tool = useCanvasStore((s) => s.tool);
    const setTool = useCanvasStore((s) => s.setTool);

    // Transform state for pan/zoom
    const [transform, setTransform] = useState<Transform>({
      scale: 1,
      translateX: 0,
      translateY: 0,
    });

    // Refs for gesture tracking
    const isDrawing = useRef(false);
    const isPinching = useRef(false);
    const lastDistance = useRef(0);
    const lastCenter = useRef({ x: 0, y: 0 });
    const savedTransform = useRef<Transform>({ scale: 1, translateX: 0, translateY: 0 });
    const previousTool = useRef<'pen' | 'eraser'>('pen');
    const sPenButtonPressed = useRef(false);

    // Convert screen coordinates to canvas coordinates
    const screenToCanvas = useCallback((screenX: number, screenY: number) => {
      return {
        x: (screenX - transform.translateX) / transform.scale,
        y: (screenY - transform.translateY) / transform.scale,
      };
    }, [transform]);

    // Check if S Pen button is pressed (uses button property on Android)
    const isSPenButtonPressed = (evt: GestureResponderEvent) => {
      const nativeEvent = evt.nativeEvent as any;
      // S Pen button press is indicated by button === 2 or 32 depending on device
      // Also check for stylus with button pressed
      return nativeEvent.button === 2 || nativeEvent.button === 32 ||
             (nativeEvent.pointerType === 'pen' && nativeEvent.buttons > 1);
    };

    const panResponder = useMemo(
      () =>
        PanResponder.create({
          onStartShouldSetPanResponder: () => true,
          onMoveShouldSetPanResponder: () => true,
          onPanResponderGrant: (evt) => {
            const touches = evt.nativeEvent.touches;

            // Check for S Pen button press - switch to eraser temporarily
            if (isSPenButtonPressed(evt)) {
              sPenButtonPressed.current = true;
              previousTool.current = tool;
              setTool('eraser');
            }

            if (touches.length >= 2) {
              // Two finger gesture - start pinch/pan
              isPinching.current = true;
              isDrawing.current = false;
              lastDistance.current = getDistance(touches as any);
              lastCenter.current = getCenter(touches as any);
              savedTransform.current = { ...transform };
            } else {
              // Single finger - drawing
              isDrawing.current = true;
              isPinching.current = false;
              const { locationX, locationY } = evt.nativeEvent;
              const point = screenToCanvas(locationX, locationY);
              startStroke(point);
            }
          },
          onPanResponderMove: (evt) => {
            const touches = evt.nativeEvent.touches;

            if (touches.length >= 2 && !isDrawing.current) {
              // Two finger gesture - pinch to zoom and pan
              isPinching.current = true;

              const newDistance = getDistance(touches as any);
              const newCenter = getCenter(touches as any);

              if (lastDistance.current > 0) {
                // Calculate scale change
                const scaleChange = newDistance / lastDistance.current;
                const newScale = Math.max(0.5, Math.min(savedTransform.current.scale * scaleChange, 4));

                // Calculate pan
                const dx = newCenter.x - lastCenter.current.x;
                const dy = newCenter.y - lastCenter.current.y;

                setTransform({
                  scale: newScale,
                  translateX: savedTransform.current.translateX + dx,
                  translateY: savedTransform.current.translateY + dy,
                });
              }
            } else if (isDrawing.current && touches.length === 1) {
              // Single finger - continue drawing
              const { locationX, locationY } = evt.nativeEvent;
              const point = screenToCanvas(locationX, locationY);
              addPoint(point);
            }
          },
          onPanResponderRelease: (evt) => {
            if (isDrawing.current) {
              endStroke();
            }

            // Restore previous tool if S Pen button was pressed
            if (sPenButtonPressed.current) {
              setTool(previousTool.current);
              sPenButtonPressed.current = false;
            }

            isDrawing.current = false;
            isPinching.current = false;
            lastDistance.current = 0;
          },
          onPanResponderTerminate: () => {
            if (isDrawing.current) {
              endStroke();
            }

            // Restore previous tool if S Pen button was pressed
            if (sPenButtonPressed.current) {
              setTool(previousTool.current);
              sPenButtonPressed.current = false;
            }

            isDrawing.current = false;
            isPinching.current = false;
            lastDistance.current = 0;
          },
        }),
      [startStroke, addPoint, endStroke, screenToCanvas, transform, tool, setTool]
    );

    // Reset transform function exposed to toolbar
    const resetTransform = useCallback(() => {
      setTransform({ scale: 1, translateX: 0, translateY: 0 });
    }, []);

    // Expose reset function via store
    React.useEffect(() => {
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

    const pointsToPath = (points: { x: number; y: number }[]): string => {
      if (!points || points.length < 2) return '';
      let path = `M ${points[0].x} ${points[0].y}`;
      for (let i = 1; i < points.length; i++) {
        path += ` L ${points[i].x} ${points[i].y}`;
      }
      return path;
    };

    const bgColor = isDark ? '#1A1A1A' : '#FFFFFF';
    const gridColor = isDark ? '#333333' : '#E8E8E8';
    const borderColor = isDark ? '#444444' : '#CCCCCC';

    // Extended grid for pan/zoom
    const gridLines = useMemo(() => {
      if (!showGrid) return null;
      const lines = [];
      const gridSpacing = 25;
      // Extend grid beyond visible area for panning
      const extendFactor = 3;
      const extendedWidth = canvasWidth * extendFactor;
      const extendedHeight = effectiveHeight * extendFactor;
      const offsetX = -canvasWidth;
      const offsetY = -effectiveHeight;

      for (let x = offsetX; x < extendedWidth + offsetX; x += gridSpacing) {
        lines.push(
          <Path
            key={`v-${x}`}
            d={`M ${x} ${offsetY} L ${x} ${extendedHeight + offsetY}`}
            stroke={gridColor}
            strokeWidth={0.5 / transform.scale}
          />
        );
      }
      for (let y = offsetY; y < extendedHeight + offsetY; y += gridSpacing) {
        lines.push(
          <Path
            key={`h-${y}`}
            d={`M ${offsetX} ${y} L ${extendedWidth + offsetX} ${y}`}
            stroke={gridColor}
            strokeWidth={0.5 / transform.scale}
          />
        );
      }
      return lines;
    }, [showGrid, canvasWidth, effectiveHeight, gridColor, transform.scale]);

    return (
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
        {...panResponder.panHandlers}
      >
        <Svg
          width={canvasWidth}
          height={effectiveHeight}
          viewBox={`${-transform.translateX / transform.scale} ${-transform.translateY / transform.scale} ${canvasWidth / transform.scale} ${effectiveHeight / transform.scale}`}
        >
          <G>{gridLines}</G>
          <G>
            {strokes.map((stroke, index) => {
              const d = pointsToPath(stroke.points);
              if (!d) return null;
              return (
                <Path
                  key={index}
                  d={d}
                  stroke={stroke.color}
                  strokeWidth={stroke.width / transform.scale}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              );
            })}
            {currentStroke && currentStroke.points && currentStroke.points.length > 1 && (
              <Path
                d={pointsToPath(currentStroke.points)}
                stroke={currentStroke.color}
                strokeWidth={currentStroke.width / transform.scale}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            )}
          </G>
        </Svg>

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
      </View>
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
  svgContainer: {
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

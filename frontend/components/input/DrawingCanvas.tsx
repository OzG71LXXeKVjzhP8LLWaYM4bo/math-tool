import React, { forwardRef, useState, useMemo } from 'react';
import { View, StyleSheet, PanResponder, LayoutChangeEvent } from 'react-native';
import Svg, { Path, G } from 'react-native-svg';
import { useCanvasStore } from '@/stores/canvas-store';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface DrawingCanvasProps {
  width?: number;
  height?: number;
  showGrid?: boolean;
}

export const DrawingCanvas = forwardRef<View, DrawingCanvasProps>(
  ({ height = 250, showGrid = true }, ref) => {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const [canvasWidth, setCanvasWidth] = useState(300);

    const strokes = useCanvasStore((s) => s.strokes);
    const currentStroke = useCanvasStore((s) => s.currentStroke);

    const panResponder = useMemo(
      () =>
        PanResponder.create({
          onStartShouldSetPanResponder: () => true,
          onMoveShouldSetPanResponder: () => true,
          onPanResponderGrant: (evt) => {
            const { locationX, locationY } = evt.nativeEvent;
            useCanvasStore.getState().startStroke({ x: locationX, y: locationY });
          },
          onPanResponderMove: (evt) => {
            const { locationX, locationY } = evt.nativeEvent;
            useCanvasStore.getState().addPoint({ x: locationX, y: locationY });
          },
          onPanResponderRelease: () => {
            useCanvasStore.getState().endStroke();
          },
        }),
      []
    );

    const handleLayout = (event: LayoutChangeEvent) => {
      setCanvasWidth(event.nativeEvent.layout.width);
    };

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

    const gridLines = useMemo(() => {
      if (!showGrid) return null;
      const lines = [];
      const gridSpacing = 25;
      for (let x = gridSpacing; x < canvasWidth; x += gridSpacing) {
        lines.push(
          <Path
            key={`v-${x}`}
            d={`M ${x} 0 L ${x} ${height}`}
            stroke={gridColor}
            strokeWidth={0.5}
          />
        );
      }
      for (let y = gridSpacing; y < height; y += gridSpacing) {
        lines.push(
          <Path
            key={`h-${y}`}
            d={`M 0 ${y} L ${canvasWidth} ${y}`}
            stroke={gridColor}
            strokeWidth={0.5}
          />
        );
      }
      return lines;
    }, [showGrid, canvasWidth, height, gridColor]);

    return (
      <View
        ref={ref}
        style={[
          styles.container,
          {
            height,
            backgroundColor: bgColor,
            borderColor,
          },
        ]}
        onLayout={handleLayout}
        {...panResponder.panHandlers}
      >
        <Svg width={canvasWidth} height={height}>
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
                  strokeWidth={stroke.width}
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
                strokeWidth={currentStroke.width}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            )}
          </G>
        </Svg>
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
});

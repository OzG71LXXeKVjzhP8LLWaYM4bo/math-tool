import React, { useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  PanResponder,
  Dimensions,
} from 'react-native';
import Svg, { Path, G } from 'react-native-svg';
import { useCanvasStore } from '@/stores/canvas-store';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { Point, Stroke } from '@/types';

interface DrawingCanvasProps {
  width?: number;
  height?: number;
  showGrid?: boolean;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Convert stroke points to SVG path
const pointsToPath = (points: Point[]): string => {
  if (points.length < 2) return '';

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let i = 1; i < points.length; i++) {
    const p0 = points[i - 1];
    const p1 = points[i];

    // Use quadratic bezier for smoother lines
    const midX = (p0.x + p1.x) / 2;
    const midY = (p0.y + p1.y) / 2;
    path += ` Q ${p0.x} ${p0.y} ${midX} ${midY}`;
  }

  // Add final point
  const lastPoint = points[points.length - 1];
  path += ` L ${lastPoint.x} ${lastPoint.y}`;

  return path;
};

// Grid pattern component
const GridPattern = ({ width, height, spacing = 30 }: { width: number; height: number; spacing?: number }) => {
  const paths: string[] = [];

  // Vertical lines
  for (let x = spacing; x < width; x += spacing) {
    paths.push(`M ${x} 0 L ${x} ${height}`);
  }

  // Horizontal lines
  for (let y = spacing; y < height; y += spacing) {
    paths.push(`M 0 ${y} L ${width} ${y}`);
  }

  return (
    <G opacity={0.15}>
      {paths.map((d, i) => (
        <Path key={i} d={d} stroke="#888888" strokeWidth={0.5} />
      ))}
    </G>
  );
};

export function DrawingCanvas({
  width = screenWidth,
  height = screenHeight * 0.6,
  showGrid = true,
}: DrawingCanvasProps) {
  const colorScheme = useColorScheme();
  const svgRef = useRef<any>(null);

  const {
    strokes,
    currentStroke,
    startStroke,
    addPoint,
    endStroke,
  } = useCanvasStore();

  const getLocationFromEvent = useCallback(
    (evt: any): Point => {
      const { locationX, locationY } = evt.nativeEvent;
      return { x: locationX, y: locationY };
    },
    []
  );

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: (evt) => {
        const point = getLocationFromEvent(evt);
        startStroke(point);
      },

      onPanResponderMove: (evt) => {
        const point = getLocationFromEvent(evt);
        addPoint(point);
      },

      onPanResponderRelease: () => {
        endStroke();
      },

      onPanResponderTerminate: () => {
        endStroke();
      },
    })
  ).current;

  const backgroundColor = colorScheme === 'dark' ? Colors.dark.background : '#FFFFFF';

  return (
    <View
      style={[styles.container, { width, height, backgroundColor }]}
      {...panResponder.panHandlers}
    >
      <Svg
        ref={svgRef}
        width={width}
        height={height}
        style={styles.svg}
      >
        {/* Grid background */}
        {showGrid && <GridPattern width={width} height={height} />}

        {/* Completed strokes */}
        {strokes.map((stroke: Stroke) => (
          <Path
            key={stroke.id}
            d={pointsToPath(stroke.points)}
            stroke={stroke.color}
            strokeWidth={stroke.width}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        ))}

        {/* Current stroke being drawn */}
        {currentStroke && currentStroke.points.length > 1 && (
          <Path
            d={pointsToPath(currentStroke.points)}
            stroke={currentStroke.color}
            strokeWidth={currentStroke.width}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        )}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  svg: {
    flex: 1,
  },
});

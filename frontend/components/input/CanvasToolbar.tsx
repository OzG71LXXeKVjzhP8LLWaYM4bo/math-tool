import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCanvasStore } from '@/stores/canvas-store';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

const COLORS = ['#000000', '#2563EB', '#DC2626', '#16A34A'];
const STROKE_WIDTHS = [2, 4];

export function CanvasToolbar() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const {
    tool,
    currentColor,
    strokeWidth,
    undoStack,
    redoStack,
    strokes,
    setTool,
    setColor,
    setStrokeWidth,
    undo,
    redo,
    clear,
  } = useCanvasStore();

  const bgColor = isDark ? '#2A2A2A' : '#F5F5F5';
  const borderColor = isDark ? '#444' : '#DDD';
  const activeColor = isDark ? Colors.dark.tint : Colors.light.tint;
  const iconColor = isDark ? '#CCC' : '#666';
  const disabledColor = isDark ? '#555' : '#BBB';

  return (
    <View style={[styles.container, { backgroundColor: bgColor, borderColor }]}>
      {/* Tools */}
      <View style={styles.section}>
        <TouchableOpacity
          style={[
            styles.toolButton,
            tool === 'pen' && { backgroundColor: `${activeColor}30` },
          ]}
          onPress={() => setTool('pen')}
        >
          <Ionicons
            name="pencil"
            size={20}
            color={tool === 'pen' ? activeColor : iconColor}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toolButton,
            tool === 'eraser' && { backgroundColor: `${activeColor}30` },
          ]}
          onPress={() => setTool('eraser')}
        >
          <Ionicons
            name="color-wand-outline"
            size={20}
            color={tool === 'eraser' ? activeColor : iconColor}
          />
        </TouchableOpacity>
      </View>

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: borderColor }]} />

      {/* Colors */}
      <View style={styles.section}>
        {COLORS.map((color) => (
          <TouchableOpacity
            key={color}
            style={[
              styles.colorButton,
              { backgroundColor: color },
              currentColor === color && styles.colorSelected,
              currentColor === color && { borderColor: activeColor },
            ]}
            onPress={() => setColor(color)}
          />
        ))}
      </View>

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: borderColor }]} />

      {/* Stroke Width */}
      <View style={styles.section}>
        {STROKE_WIDTHS.map((width) => (
          <TouchableOpacity
            key={width}
            style={[
              styles.widthButton,
              strokeWidth === width && { backgroundColor: `${activeColor}30` },
            ]}
            onPress={() => setStrokeWidth(width)}
          >
            <View
              style={[
                styles.widthIndicator,
                {
                  width: width * 4,
                  height: width * 4,
                  backgroundColor: strokeWidth === width ? activeColor : iconColor,
                },
              ]}
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: borderColor }]} />

      {/* Actions */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={undo}
          disabled={undoStack.length === 0}
        >
          <Ionicons
            name="arrow-undo"
            size={20}
            color={undoStack.length === 0 ? disabledColor : iconColor}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={redo}
          disabled={redoStack.length === 0}
        >
          <Ionicons
            name="arrow-redo"
            size={20}
            color={redoStack.length === 0 ? disabledColor : iconColor}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={clear}
          disabled={strokes.length === 0}
        >
          <Ionicons
            name="trash-outline"
            size={20}
            color={strokes.length === 0 ? disabledColor : '#DC2626'}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
  },
  section: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  divider: {
    width: 1,
    height: 24,
    marginHorizontal: 8,
  },
  toolButton: {
    padding: 8,
    borderRadius: 8,
  },
  colorButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorSelected: {
    borderWidth: 2,
  },
  widthButton: {
    padding: 8,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  widthIndicator: {
    borderRadius: 50,
  },
  actionButton: {
    padding: 8,
  },
});

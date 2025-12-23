import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCanvasStore } from '@/stores/canvas-store';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const COLORS = ['#000000', '#2196F3', '#F44336', '#4CAF50', '#FF9800', '#9C27B0'];
const STROKE_WIDTHS = [2, 4, 6, 8];

export function ToolPalette() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const {
    currentColor,
    strokeWidth,
    tool,
    setColor,
    setStrokeWidth,
    setTool,
    undo,
    redo,
    clear,
    undoStack,
    redoStack,
  } = useCanvasStore();

  const iconColor = isDark ? Colors.dark.text : Colors.light.text;
  const activeColor = isDark ? Colors.dark.tint : Colors.light.tint;
  const bgColor = isDark ? '#2A2A2A' : '#F5F5F5';

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Tool selection */}
      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.toolButton, tool === 'pen' && styles.activeTool]}
          onPress={() => setTool('pen')}
        >
          <Ionicons
            name="pencil"
            size={24}
            color={tool === 'pen' ? activeColor : iconColor}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toolButton, tool === 'highlighter' && styles.activeTool]}
          onPress={() => setTool('highlighter')}
        >
          <Ionicons
            name="color-fill"
            size={24}
            color={tool === 'highlighter' ? activeColor : iconColor}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toolButton, tool === 'eraser' && styles.activeTool]}
          onPress={() => setTool('eraser')}
        >
          <Ionicons
            name="cut"
            size={24}
            color={tool === 'eraser' ? activeColor : iconColor}
          />
        </TouchableOpacity>
      </View>

      {/* Color selection */}
      <View style={styles.section}>
        {COLORS.map((color) => (
          <TouchableOpacity
            key={color}
            style={[
              styles.colorButton,
              { backgroundColor: color },
              currentColor === color && styles.activeColor,
            ]}
            onPress={() => setColor(color)}
          />
        ))}
      </View>

      {/* Stroke width */}
      <View style={styles.section}>
        {STROKE_WIDTHS.map((width) => (
          <TouchableOpacity
            key={width}
            style={[
              styles.widthButton,
              strokeWidth === width && { borderColor: activeColor },
            ]}
            onPress={() => setStrokeWidth(width)}
          >
            <View
              style={[
                styles.widthDot,
                {
                  width: width * 2,
                  height: width * 2,
                  backgroundColor: currentColor,
                },
              ]}
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* Actions */}
      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.actionButton, undoStack.length === 0 && styles.disabled]}
          onPress={undo}
          disabled={undoStack.length === 0}
        >
          <Ionicons
            name="arrow-undo"
            size={24}
            color={undoStack.length === 0 ? '#999' : iconColor}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, redoStack.length === 0 && styles.disabled]}
          onPress={redo}
          disabled={redoStack.length === 0}
        >
          <Ionicons
            name="arrow-redo"
            size={24}
            color={redoStack.length === 0 ? '#999' : iconColor}
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={clear}>
          <Ionicons name="trash-outline" size={24} color="#F44336" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    borderRadius: 12,
    marginVertical: 8,
  },
  section: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
    gap: 8,
  },
  toolButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTool: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  colorButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeColor: {
    borderColor: '#007AFF',
    transform: [{ scale: 1.2 }],
  },
  widthButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  widthDot: {
    borderRadius: 50,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
});

import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCanvasStore } from '@/stores/canvas-store';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const COLORS = ['#000000', '#2563EB', '#DC2626', '#16A34A'];
const STROKE_WIDTHS = [2, 4];

type InputMode = 'draw' | 'camera';

interface MiniToolbarProps {
  expanded: boolean;
  onToggleExpand: () => void;
  mode: InputMode;
  onModeChange: (mode: InputMode) => void;
}

export function MiniToolbar({ expanded, onToggleExpand, mode, onModeChange }: MiniToolbarProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { currentColor, undoStack, strokes, undo, clear, resetTransform } = useCanvasStore();

  const bgColor = isDark ? '#2A2A2A' : '#F5F5F5';
  const borderColor = isDark ? '#444' : '#DDD';
  const activeColor = isDark ? Colors.dark.tint : Colors.light.tint;
  const iconColor = isDark ? '#CCC' : '#666';
  const disabledColor = isDark ? '#555' : '#BBB';
  const textColor = isDark ? Colors.dark.text : Colors.light.text;
  const subtextColor = isDark ? '#888' : '#666';

  return (
    <View style={[styles.miniContainer, { backgroundColor: bgColor, borderColor }]}>
      {/* Left side - Tools */}
      <View style={styles.miniLeft}>
        <TouchableOpacity
          style={styles.miniButton}
          onPress={onToggleExpand}
        >
          <Ionicons
            name={expanded ? 'chevron-up' : 'settings-outline'}
            size={20}
            color={expanded ? activeColor : iconColor}
          />
        </TouchableOpacity>

        {/* Current color indicator */}
        <View style={[styles.colorIndicator, { backgroundColor: currentColor }]} />

        <TouchableOpacity
          style={styles.miniButton}
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
          style={styles.miniButton}
          onPress={clear}
          disabled={strokes.length === 0}
        >
          <Ionicons
            name="trash-outline"
            size={18}
            color={strokes.length === 0 ? disabledColor : '#DC2626'}
          />
        </TouchableOpacity>

        {resetTransform && (
          <TouchableOpacity
            style={styles.miniButton}
            onPress={resetTransform}
          >
            <Ionicons
              name="scan-outline"
              size={18}
              color={iconColor}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Right side - Mode selector */}
      <View style={styles.miniRight}>
        <TouchableOpacity
          style={[
            styles.modeTab,
            mode === 'draw' && { backgroundColor: `${activeColor}20` },
          ]}
          onPress={() => onModeChange('draw')}
        >
          <Ionicons
            name="pencil"
            size={16}
            color={mode === 'draw' ? activeColor : subtextColor}
          />
          <Text style={[styles.modeText, { color: mode === 'draw' ? activeColor : subtextColor }]}>
            Draw
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.modeTab,
            mode === 'camera' && { backgroundColor: `${activeColor}20` },
          ]}
          onPress={() => onModeChange('camera')}
        >
          <Ionicons
            name="camera"
            size={16}
            color={mode === 'camera' ? activeColor : subtextColor}
          />
          <Text style={[styles.modeText, { color: mode === 'camera' ? activeColor : subtextColor }]}>
            Photo
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

interface ExpandedToolbarProps {
  onClose: () => void;
}

export function ExpandedToolbar({ onClose }: ExpandedToolbarProps) {
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
    resetTransform,
  } = useCanvasStore();

  const bgColor = isDark ? '#2A2A2A' : '#F5F5F5';
  const borderColor = isDark ? '#444' : '#DDD';
  const activeColor = isDark ? Colors.dark.tint : Colors.light.tint;
  const iconColor = isDark ? '#CCC' : '#666';
  const disabledColor = isDark ? '#555' : '#BBB';

  return (
    <View style={[styles.expandedContainer, { backgroundColor: bgColor, borderColor }]}>
      {/* Close button */}
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Ionicons name="chevron-up" size={20} color={activeColor} />
      </TouchableOpacity>

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: borderColor }]} />

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
        {resetTransform && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={resetTransform}
          >
            <Ionicons
              name="scan-outline"
              size={20}
              color={iconColor}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// Legacy export for backwards compatibility
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
  // Mini toolbar styles
  miniContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  miniLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  miniRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  miniButton: {
    padding: 8,
    borderRadius: 8,
  },
  colorIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginHorizontal: 4,
  },
  modeTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  modeText: {
    fontSize: 13,
    fontWeight: '500',
  },

  // Expanded toolbar styles
  expandedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  closeButton: {
    padding: 4,
  },

  // Legacy/shared styles
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

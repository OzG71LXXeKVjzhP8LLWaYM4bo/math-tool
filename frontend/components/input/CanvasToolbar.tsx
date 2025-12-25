import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Modal,
  Platform,
  UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCanvasStore } from '@/stores/canvas-store';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const COLORS = [
  '#000000', // Black
  '#2563EB', // Blue
  '#DC2626', // Red
  '#16A34A', // Green
  '#F59E0B', // Amber
  '#F97316', // Orange
  '#8B5CF6', // Purple
  '#FFFFFF', // White
];

const STROKE_WIDTHS = [1, 2, 4, 6];

interface ColorPickerPopupProps {
  visible: boolean;
  onClose: () => void;
}

function ColorPickerPopup({ visible, onClose }: ColorPickerPopupProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { currentColor, strokeWidth, setColor, setStrokeWidth } = useCanvasStore();

  const bgColor = isDark ? '#2A2A2A' : '#FFFFFF';
  const borderColor = isDark ? '#444' : '#E0E0E0';
  const activeColor = isDark ? Colors.dark.tint : Colors.light.tint;

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable
          style={[styles.popupContainer, { backgroundColor: bgColor, borderColor }]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Colors - 2 rows of 4 */}
          <View style={styles.colorsGrid}>
            {COLORS.map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorOption,
                  { backgroundColor: color },
                  color === '#FFFFFF' && styles.whiteColorBorder,
                  currentColor === color && [styles.colorSelected, { borderColor: activeColor }],
                ]}
                onPress={() => {
                  setColor(color);
                  onClose();
                }}
              />
            ))}
          </View>

          {/* Divider */}
          <View style={[styles.popupDivider, { backgroundColor: borderColor }]} />

          {/* Stroke widths */}
          <View style={styles.widthsRow}>
            {STROKE_WIDTHS.map((width) => (
              <TouchableOpacity
                key={width}
                style={[
                  styles.widthOption,
                  strokeWidth === width && { backgroundColor: `${activeColor}20` },
                ]}
                onPress={() => {
                  setStrokeWidth(width);
                  onClose();
                }}
              >
                <View
                  style={[
                    styles.widthDot,
                    {
                      width: width * 3 + 4,
                      height: width * 3 + 4,
                      backgroundColor: strokeWidth === width ? activeColor : (isDark ? '#888' : '#666'),
                    },
                  ]}
                />
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Divider() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  return (
    <View
      style={[
        styles.divider,
        { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' },
      ]}
    />
  );
}

interface ToolButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  active?: boolean;
  onPress: () => void;
}

function ToolButton({ icon, active, onPress }: ToolButtonProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const activeColor = isDark ? Colors.dark.tint : Colors.light.tint;
  const iconColor = isDark ? '#CCC' : '#666';

  return (
    <TouchableOpacity
      style={[
        styles.toolButton,
        active && { backgroundColor: `${activeColor}25` },
      ]}
      onPress={onPress}
    >
      <Ionicons
        name={icon}
        size={20}
        color={active ? activeColor : iconColor}
      />
    </TouchableOpacity>
  );
}

interface ActionButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  disabled?: boolean;
  destructive?: boolean;
}

function ActionButton({ icon, onPress, disabled, destructive }: ActionButtonProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const iconColor = isDark ? '#CCC' : '#666';
  const disabledColor = isDark ? '#555' : '#BBB';
  const destructiveColor = '#DC2626';

  return (
    <TouchableOpacity
      style={styles.actionButton}
      onPress={onPress}
      disabled={disabled}
    >
      <Ionicons
        name={icon}
        size={20}
        color={disabled ? disabledColor : (destructive ? destructiveColor : iconColor)}
      />
    </TouchableOpacity>
  );
}

export function FloatingToolbar() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [showColorPicker, setShowColorPicker] = useState(false);

  const {
    tool,
    currentColor,
    undoStack,
    redoStack,
    strokes,
    setTool,
    undo,
    redo,
    clear,
    resetTransform,
  } = useCanvasStore();

  const bgColor = isDark ? 'rgba(40, 40, 40, 0.95)' : 'rgba(255, 255, 255, 0.95)';

  return (
    <>
      <View style={[styles.floatingContainer, { backgroundColor: bgColor }]}>
        {/* Tools section */}
        <View style={styles.section}>
          <ToolButton
            icon="pencil"
            active={tool === 'pen'}
            onPress={() => setTool('pen')}
          />
          <ToolButton
            icon="bandage-outline"
            active={tool === 'eraser'}
            onPress={() => setTool('eraser')}
          />
        </View>

        <Divider />

        {/* Color indicator */}
        <TouchableOpacity
          style={styles.colorIndicatorButton}
          onPress={() => setShowColorPicker(true)}
        >
          <View
            style={[
              styles.colorIndicator,
              { backgroundColor: currentColor },
              currentColor === '#FFFFFF' && styles.whiteColorBorder,
            ]}
          />
        </TouchableOpacity>

        <Divider />

        {/* History section */}
        <View style={styles.section}>
          <ActionButton
            icon="arrow-undo"
            onPress={undo}
            disabled={undoStack.length === 0}
          />
          <ActionButton
            icon="arrow-redo"
            onPress={redo}
            disabled={redoStack.length === 0}
          />
        </View>

        <Divider />

        {/* Actions section */}
        <View style={styles.section}>
          <ActionButton
            icon="trash-outline"
            onPress={clear}
            disabled={strokes.length === 0}
            destructive
          />
          {resetTransform && (
            <ActionButton
              icon="expand-outline"
              onPress={resetTransform}
            />
          )}
        </View>
      </View>

      <ColorPickerPopup
        visible={showColorPicker}
        onClose={() => setShowColorPicker(false)}
      />
    </>
  );
}

// Legacy exports for backwards compatibility
export { FloatingToolbar as MiniToolbar };
export { FloatingToolbar as ExpandedToolbar };
export { FloatingToolbar as CanvasToolbar };

const styles = StyleSheet.create({
  // Floating toolbar
  floatingContainer: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  section: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  divider: {
    width: 1,
    height: 24,
    marginHorizontal: 8,
  },
  toolButton: {
    padding: 8,
    borderRadius: 10,
  },
  actionButton: {
    padding: 8,
  },
  colorIndicatorButton: {
    padding: 4,
  },
  colorIndicator: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  whiteColorBorder: {
    borderWidth: 1,
    borderColor: '#CCC',
  },

  // Color picker popup
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popupContainer: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  colorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 176, // 4 colors * 44px
    gap: 8,
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorSelected: {
    borderWidth: 3,
  },
  popupDivider: {
    height: 1,
    marginVertical: 12,
  },
  widthsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 8,
  },
  widthOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  widthDot: {
    borderRadius: 50,
  },
});

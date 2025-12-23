import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface CanvasControlsProps {
  onSolve: () => void;
  onSave?: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export function CanvasControls({
  onSolve,
  onSave,
  isLoading = false,
  disabled = false,
}: CanvasControlsProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const primaryColor = isDark ? Colors.dark.tint : Colors.light.tint;
  const textColor = isDark ? Colors.dark.text : Colors.light.text;

  return (
    <View style={styles.container}>
      {onSave && (
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={onSave}
          disabled={disabled || isLoading}
        >
          <Ionicons name="save-outline" size={20} color={textColor} />
          <Text style={[styles.buttonText, { color: textColor }]}>Save</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[
          styles.button,
          styles.primaryButton,
          { backgroundColor: primaryColor },
          (disabled || isLoading) && styles.disabled,
        ]}
        onPress={onSolve}
        disabled={disabled || isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <>
            <Ionicons name="calculator" size={20} color="#FFFFFF" />
            <Text style={[styles.buttonText, styles.primaryText]}>Solve</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    minWidth: 120,
  },
  primaryButton: {
    flex: 1,
    maxWidth: 200,
  },
  secondaryButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryText: {
    color: '#FFFFFF',
  },
  disabled: {
    opacity: 0.5,
  },
});

import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { DIFFICULTY_LABELS, DIFFICULTY_COLORS } from '@/constants/topics';

interface DifficultyBadgeProps {
  difficulty: number;
  size?: 'small' | 'medium' | 'large';
}

export function DifficultyBadge({ difficulty, size = 'medium' }: DifficultyBadgeProps) {
  const label = DIFFICULTY_LABELS[difficulty] || `Level ${difficulty}`;
  const color = DIFFICULTY_COLORS[difficulty] || '#888888';

  const sizeStyles = {
    small: { paddingVertical: 2, paddingHorizontal: 6, fontSize: 10 },
    medium: { paddingVertical: 4, paddingHorizontal: 10, fontSize: 12 },
    large: { paddingVertical: 6, paddingHorizontal: 14, fontSize: 14 },
  };

  const { paddingVertical, paddingHorizontal, fontSize } = sizeStyles[size];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: `${color}20`,
          paddingVertical,
          paddingHorizontal,
        },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.label, { color, fontSize }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontWeight: '600',
  },
});

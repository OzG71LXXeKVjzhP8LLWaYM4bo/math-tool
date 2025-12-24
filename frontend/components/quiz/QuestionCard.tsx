import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { LatexRenderer } from '@/components/latex/LatexRenderer';
import type { Question } from '@/types';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface QuestionCardProps {
  question: Question;
  questionNumber?: number;
  totalQuestions?: number;
}

export function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
}: QuestionCardProps) {
  // Debug: log the question object
  console.log('[QuestionCard] Question object:', JSON.stringify(question, null, 2));

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const bgColor = isDark ? '#1E1E1E' : '#FFFFFF';
  const textColor = isDark ? Colors.dark.text : Colors.light.text;
  const subtextColor = isDark ? '#888' : '#666';
  const activeColor = isDark ? Colors.dark.tint : Colors.light.tint;

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.topicInfo}>
          <Text style={[styles.topic, { color: textColor }]}>{question.topic}</Text>
        </View>

        <View style={styles.headerRight}>
          {questionNumber && totalQuestions && (
            <Text style={[styles.questionNumber, { color: subtextColor }]}>
              {questionNumber} of {totalQuestions}
            </Text>
          )}
          <View style={[styles.examBadge, { backgroundColor: `${activeColor}20` }]}>
            <Text style={[styles.examBadgeText, { color: activeColor }]}>IB Exam</Text>
          </View>
        </View>
      </View>

      {/* Question */}
      <View style={styles.questionContainer}>
        <LatexRenderer latex={question.question_latex} fontSize={20} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  topicInfo: {
    flex: 1,
  },
  topic: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  questionNumber: {
    fontSize: 14,
  },
  examBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  examBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  questionContainer: {
    marginTop: 8,
  },
});

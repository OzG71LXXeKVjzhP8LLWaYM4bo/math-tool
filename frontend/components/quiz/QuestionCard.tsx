import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { LatexRenderer } from '@/components/latex/LatexRenderer';
import { DifficultyBadge } from './DifficultyBadge';
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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const bgColor = isDark ? '#1E1E1E' : '#FFFFFF';
  const textColor = isDark ? Colors.dark.text : Colors.light.text;
  const subtextColor = isDark ? '#888' : '#666';

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.topicInfo}>
          <Text style={[styles.subject, { color: subtextColor }]}>
            {question.subject.charAt(0).toUpperCase() + question.subject.slice(1)}
          </Text>
          <Text style={[styles.topic, { color: textColor }]}>{question.topic}</Text>
        </View>

        <View style={styles.headerRight}>
          {questionNumber && totalQuestions && (
            <Text style={[styles.questionNumber, { color: subtextColor }]}>
              {questionNumber}/{totalQuestions}
            </Text>
          )}
          <DifficultyBadge difficulty={question.difficulty} />
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
  subject: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  topic: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  questionNumber: {
    fontSize: 14,
    marginBottom: 4,
  },
  questionContainer: {
    marginTop: 8,
  },
});

import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useProgressStore } from '@/stores/progress-store';
import { DifficultyBadge } from '@/components/quiz/DifficultyBadge';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { SUBJECT_NAMES, type Subject } from '@/constants/topics';

export default function ProgressScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { progress, topicProgress, isLoading, refreshAll, fetchProgress } = useProgressStore();

  useEffect(() => {
    refreshAll();
  }, []);

  const textColor = isDark ? Colors.dark.text : Colors.light.text;
  const subtextColor = isDark ? '#888' : '#666';
  const cardBg = isDark ? '#1E1E1E' : '#FFFFFF';
  const activeColor = isDark ? Colors.dark.tint : Colors.light.tint;

  // Calculate overall stats
  const totalAttempts = progress.reduce((sum, p) => sum + p.total_attempts, 0);
  const totalCorrect = progress.reduce((sum, p) => sum + p.correct_answers, 0);
  const overallAccuracy = totalAttempts > 0 ? totalCorrect / totalAttempts : 0;
  const maxStreak = progress.reduce((max, p) => Math.max(max, p.current_streak), 0);
  const avgMastery = progress.length > 0
    ? progress.reduce((sum, p) => sum + p.mastery_level, 0) / progress.length
    : 0;

  // Group progress by subject
  const progressBySubject: Record<string, typeof progress> = {};
  progress.forEach((p) => {
    if (!progressBySubject[p.subject]) {
      progressBySubject[p.subject] = [];
    }
    progressBySubject[p.subject].push(p);
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? Colors.dark.background : '#F5F5F5' }]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refreshAll} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: textColor }]}>Progress</Text>
          <Text style={[styles.subtitle, { color: subtextColor }]}>
            Track your learning journey
          </Text>
        </View>

        {/* Overall Stats */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: cardBg }]}>
            <Ionicons name="checkmark-done-circle" size={28} color="#4CAF50" />
            <Text style={[styles.statValue, { color: textColor }]}>
              {Math.round(overallAccuracy * 100)}%
            </Text>
            <Text style={[styles.statLabel, { color: subtextColor }]}>Accuracy</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: cardBg }]}>
            <Ionicons name="flame" size={28} color="#FF5722" />
            <Text style={[styles.statValue, { color: textColor }]}>{maxStreak}</Text>
            <Text style={[styles.statLabel, { color: subtextColor }]}>Best Streak</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: cardBg }]}>
            <Ionicons name="trophy" size={28} color="#FFC107" />
            <Text style={[styles.statValue, { color: textColor }]}>
              {Math.round(avgMastery)}%
            </Text>
            <Text style={[styles.statLabel, { color: subtextColor }]}>Mastery</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: cardBg }]}>
            <Ionicons name="document-text" size={28} color="#2196F3" />
            <Text style={[styles.statValue, { color: textColor }]}>{totalAttempts}</Text>
            <Text style={[styles.statLabel, { color: subtextColor }]}>Questions</Text>
          </View>
        </View>

        {/* Progress by Subject */}
        {Object.entries(progressBySubject).map(([subject, subjectProgress]) => (
          <View key={subject} style={[styles.subjectSection, { backgroundColor: cardBg }]}>
            <View style={styles.subjectHeader}>
              <Ionicons
                name={
                  subject === 'math'
                    ? 'calculator'
                    : subject === 'physics'
                    ? 'planet'
                    : 'flask'
                }
                size={24}
                color={activeColor}
              />
              <Text style={[styles.subjectTitle, { color: textColor }]}>
                {SUBJECT_NAMES[subject as Subject] || subject}
              </Text>
            </View>

            {subjectProgress.map((p, index) => {
              const accuracy = p.total_attempts > 0
                ? p.correct_answers / p.total_attempts
                : 0;

              return (
                <View key={index} style={styles.topicRow}>
                  <View style={styles.topicInfo}>
                    <Text style={[styles.topicName, { color: textColor }]}>{p.topic}</Text>
                    <View style={styles.topicMeta}>
                      <Text style={[styles.topicStats, { color: subtextColor }]}>
                        {p.correct_answers}/{p.total_attempts} correct
                      </Text>
                      {p.current_streak > 0 && (
                        <View style={styles.streakBadge}>
                          <Ionicons name="flame" size={12} color="#FF5722" />
                          <Text style={styles.streakText}>{p.current_streak}</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <View style={styles.topicProgress}>
                    <Text style={[styles.accuracyText, { color: activeColor }]}>
                      {Math.round(accuracy * 100)}%
                    </Text>
                    <View style={styles.masteryContainer}>
                      <View style={styles.masteryBarBg}>
                        <View
                          style={[
                            styles.masteryBarFill,
                            {
                              width: `${p.mastery_level}%`,
                              backgroundColor: activeColor,
                            },
                          ]}
                        />
                      </View>
                      <Text style={[styles.masteryText, { color: subtextColor }]}>
                        {p.mastery_level}%
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        ))}

        {/* Empty State */}
        {progress.length === 0 && !isLoading && (
          <View style={[styles.emptyState, { backgroundColor: cardBg }]}>
            <Ionicons name="bar-chart-outline" size={48} color={subtextColor} />
            <Text style={[styles.emptyTitle, { color: textColor }]}>No Progress Yet</Text>
            <Text style={[styles.emptyText, { color: subtextColor }]}>
              Start a quiz to begin tracking your progress
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: '47%',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  subjectSection: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  subjectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E020',
  },
  subjectTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  topicRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E010',
  },
  topicInfo: {
    flex: 1,
  },
  topicName: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
  },
  topicMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topicStats: {
    fontSize: 12,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#FF572210',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  streakText: {
    fontSize: 11,
    color: '#FF5722',
    fontWeight: '600',
  },
  topicProgress: {
    alignItems: 'flex-end',
    width: 80,
  },
  accuracyText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  masteryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  masteryBarBg: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E040',
    borderRadius: 2,
    overflow: 'hidden',
  },
  masteryBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  masteryText: {
    fontSize: 10,
    width: 28,
    textAlign: 'right',
  },
  emptyState: {
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
});

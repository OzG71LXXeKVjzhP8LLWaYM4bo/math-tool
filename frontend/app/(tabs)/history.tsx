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
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function HistoryScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { quizHistory, isLoading, fetchQuizHistory } = useProgressStore();

  useEffect(() => {
    fetchQuizHistory();
  }, []);

  const textColor = isDark ? Colors.dark.text : Colors.light.text;
  const subtextColor = isDark ? '#888' : '#666';
  const cardBg = isDark ? '#1E1E1E' : '#FFFFFF';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? Colors.dark.background : '#F5F5F5' }]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={fetchQuizHistory} />
        }
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: textColor }]}>History</Text>
          <Text style={[styles.subtitle, { color: subtextColor }]}>
            Your previous quizzes
          </Text>
        </View>

        {quizHistory.length > 0 ? (
          <View style={[styles.listContainer, { backgroundColor: cardBg }]}>
            {quizHistory.map((quiz, index) => {
              const accuracy = quiz.total_questions > 0
                ? quiz.correct_answers / quiz.total_questions
                : 0;
              const date = quiz.started_at
                ? new Date(quiz.started_at).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '';

              const scoreColor = accuracy >= 0.7 ? '#4CAF50' : accuracy >= 0.4 ? '#FFC107' : '#F44336';

              return (
                <View
                  key={quiz.id}
                  style={[
                    styles.quizRow,
                    index < quizHistory.length - 1 && styles.quizRowBorder,
                  ]}
                >
                  <View style={[styles.scoreCircle, { borderColor: scoreColor }]}>
                    <Text style={[styles.scoreText, { color: scoreColor }]}>
                      {Math.round(accuracy * 100)}%
                    </Text>
                  </View>

                  <View style={styles.quizInfo}>
                    <Text style={[styles.topicText, { color: textColor }]}>
                      {quiz.topic}
                    </Text>
                    <Text style={[styles.dateText, { color: subtextColor }]}>
                      {date}
                    </Text>
                  </View>

                  <View style={styles.quizScore}>
                    <Text style={[styles.correctText, { color: textColor }]}>
                      {quiz.correct_answers}/{quiz.total_questions}
                    </Text>
                    <Text style={[styles.correctLabel, { color: subtextColor }]}>
                      correct
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={[styles.emptyState, { backgroundColor: cardBg }]}>
            <Ionicons name="time-outline" size={48} color={subtextColor} />
            <Text style={[styles.emptyTitle, { color: textColor }]}>No Quizzes Yet</Text>
            <Text style={[styles.emptyText, { color: subtextColor }]}>
              Complete a quiz to see your history
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
  listContainer: {
    borderRadius: 16,
    padding: 4,
  },
  quizRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  quizRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E015',
  },
  scoreCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  quizInfo: {
    flex: 1,
  },
  topicText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  dateText: {
    fontSize: 12,
  },
  quizScore: {
    alignItems: 'flex-end',
  },
  correctText: {
    fontSize: 18,
    fontWeight: '600',
  },
  correctLabel: {
    fontSize: 11,
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

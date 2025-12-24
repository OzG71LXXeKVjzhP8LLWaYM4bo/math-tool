import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TopicSelector } from '@/components/quiz/TopicSelector';
import { useQuizStore } from '@/stores/quiz-store';
import { useProgressStore } from '@/stores/progress-store';
import { useSettingsStore, COURSE_SHORT_NAMES } from '@/stores/settings-store';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type QuizMode = 'select' | 'new' | 'resume';

export default function QuizSelectScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { course } = useSettingsStore();

  const { quiz, startQuiz, isLoading } = useQuizStore();
  const { quizHistory, fetchQuizHistory, isLoadingHistory } = useProgressStore();

  const [mode, setMode] = useState<QuizMode>('select');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [selectedSubtopic, setSelectedSubtopic] = useState<string | null>(null);

  const textColor = isDark ? Colors.dark.text : Colors.light.text;
  const subtextColor = isDark ? '#888' : '#666';
  const cardBg = isDark ? '#1E1E1E' : '#FFFFFF';
  const activeColor = isDark ? Colors.dark.tint : Colors.light.tint;

  // Fetch quiz history when entering resume mode
  useEffect(() => {
    if (mode === 'resume') {
      fetchQuizHistory();
    }
  }, [mode]);

  // Navigate to quiz player when quiz starts
  useEffect(() => {
    if (quiz?.id) {
      router.push(`/quiz/${quiz.id}`);
    }
  }, [quiz?.id]);

  const handleTopicSelect = (topic: string, subtopic: string) => {
    setSelectedTopic(topic);
    setSelectedSubtopic(subtopic);
  };

  const handleStartQuiz = async () => {
    if (selectedTopic && selectedSubtopic && course) {
      await startQuiz(`math_${course}`, `${selectedTopic}: ${selectedSubtopic}`);
    }
  };

  const handleResumeQuiz = async (subject: string, topic: string) => {
    await startQuiz(subject, topic);
  };

  // Mode selection
  if (mode === 'select') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? Colors.dark.background : '#F5F5F5' }]}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: textColor }]}>Practice</Text>
            <Text style={[styles.subtitle, { color: subtextColor }]}>
              {course ? COURSE_SHORT_NAMES[course] : 'Choose an option'}
            </Text>
          </View>

          <View style={styles.modeOptions}>
            <TouchableOpacity
              style={[styles.modeCard, { backgroundColor: cardBg }]}
              onPress={() => setMode('new')}
            >
              <View style={[styles.modeIcon, { backgroundColor: `${activeColor}20` }]}>
                <Ionicons name="add-circle" size={32} color={activeColor} />
              </View>
              <Text style={[styles.modeTitle, { color: textColor }]}>New Quiz</Text>
              <Text style={[styles.modeDesc, { color: subtextColor }]}>
                Start a fresh practice quiz
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeCard, { backgroundColor: cardBg }]}
              onPress={() => setMode('resume')}
            >
              <View style={[styles.modeIcon, { backgroundColor: '#FFC10720' }]}>
                <Ionicons name="play-circle" size={32} color="#FFC107" />
              </View>
              <Text style={[styles.modeTitle, { color: textColor }]}>Continue Quiz</Text>
              <Text style={[styles.modeDesc, { color: subtextColor }]}>
                Resume a previous quiz
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Resume quiz selection
  if (mode === 'resume') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? Colors.dark.background : '#F5F5F5' }]}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.backButton} onPress={() => setMode('select')}>
            <Ionicons name="arrow-back" size={24} color={textColor} />
            <Text style={[styles.backText, { color: textColor }]}>Back</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={[styles.title, { color: textColor }]}>Continue Quiz</Text>
            <Text style={[styles.subtitle, { color: subtextColor }]}>
              Select a quiz to resume
            </Text>
          </View>

          {isLoadingHistory ? (
            <View style={[styles.emptyState, { backgroundColor: cardBg }]}>
              <ActivityIndicator size="large" color={activeColor} />
              <Text style={[styles.emptyText, { color: subtextColor, marginTop: 16 }]}>
                Loading quizzes...
              </Text>
            </View>
          ) : quizHistory.length > 0 ? (
            <View style={[styles.quizList, { backgroundColor: cardBg }]}>
              {quizHistory.map((historyItem, index) => {
                const date = historyItem.started_at
                  ? new Date(historyItem.started_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })
                  : '';

                return (
                  <TouchableOpacity
                    key={historyItem.id}
                    style={[
                      styles.quizItem,
                      index < quizHistory.length - 1 && styles.quizItemBorder,
                    ]}
                    onPress={() => handleResumeQuiz(historyItem.subject, historyItem.topic)}
                    disabled={isLoading}
                  >
                    <View style={styles.quizItemInfo}>
                      <Text style={[styles.quizItemTopic, { color: textColor }]}>
                        {historyItem.topic}
                      </Text>
                      <Text style={[styles.quizItemDate, { color: subtextColor }]}>
                        {date} · {historyItem.correct_answers}/{historyItem.total_questions} correct
                      </Text>
                    </View>
                    {isLoading ? (
                      <ActivityIndicator size="small" color={activeColor} />
                    ) : (
                      <Ionicons name="chevron-forward" size={20} color={subtextColor} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={[styles.emptyState, { backgroundColor: cardBg }]}>
              <Ionicons name="document-text-outline" size={48} color={subtextColor} />
              <Text style={[styles.emptyTitle, { color: textColor }]}>No Previous Quizzes</Text>
              <Text style={[styles.emptyText, { color: subtextColor }]}>
                Start a new quiz to see it here
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // New quiz - Topic selection
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? Colors.dark.background : '#F5F5F5' }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backButton} onPress={() => setMode('select')}>
          <Ionicons name="arrow-back" size={24} color={textColor} />
          <Text style={[styles.backText, { color: textColor }]}>Back</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={[styles.title, { color: textColor }]}>New Quiz</Text>
          <Text style={[styles.subtitle, { color: subtextColor }]}>
            {course ? `${COURSE_SHORT_NAMES[course]} - Select a topic` : 'Select a topic to start'}
          </Text>
        </View>

        <TopicSelector
          onSelect={handleTopicSelect}
          selectedTopic={selectedTopic || undefined}
          selectedSubtopic={selectedSubtopic || undefined}
        />

        {selectedTopic && selectedSubtopic && (
          <TouchableOpacity
            style={[styles.startButton, { backgroundColor: activeColor, opacity: isLoading ? 0.7 : 1 }]}
            onPress={handleStartQuiz}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.startButtonText}>Start Practice</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  backText: {
    fontSize: 16,
  },
  modeOptions: {
    gap: 16,
  },
  modeCard: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  modeIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  modeTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  modeDesc: {
    fontSize: 14,
    textAlign: 'center',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 20,
    gap: 8,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  quizList: {
    borderRadius: 16,
  },
  quizItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  quizItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E015',
  },
  quizItemInfo: {
    flex: 1,
  },
  quizItemTopic: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  quizItemDate: {
    fontSize: 13,
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

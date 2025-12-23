import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useProgressStore } from '@/stores/progress-store';
import { SUBJECT_NAMES, type Subject } from '@/constants/topics';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { topicProgress, fetchTopicProgress } = useProgressStore();

  useEffect(() => {
    fetchTopicProgress();
  }, []);

  const textColor = isDark ? Colors.dark.text : Colors.light.text;
  const subtextColor = isDark ? '#888' : '#666';
  const cardBg = isDark ? '#1E1E1E' : '#FFFFFF';
  const activeColor = isDark ? Colors.dark.tint : Colors.light.tint;

  const quickActions = [
    {
      icon: 'create',
      title: 'Write & Solve',
      description: 'Draw equations',
      route: '/write',
      color: '#2196F3',
    },
    {
      icon: 'school',
      title: 'Start Quiz',
      description: 'Practice topics',
      route: '/quiz',
      color: '#4CAF50',
    },
    {
      icon: 'camera',
      title: 'Upload Image',
      description: 'Scan problems',
      route: '/upload',
      color: '#FF9800',
    },
  ];

  // Calculate overall stats
  const totalAttempts = topicProgress.reduce((sum, p) => sum + (p.accuracy > 0 ? 1 : 0), 0);
  const avgAccuracy = topicProgress.length > 0
    ? topicProgress.reduce((sum, p) => sum + p.accuracy, 0) / Math.max(topicProgress.length, 1)
    : 0;
  const totalStreak = topicProgress.reduce((max, p) => Math.max(max, p.streak), 0);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? Colors.dark.background : '#F5F5F5' }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.greeting, { color: subtextColor }]}>Welcome back!</Text>
          <Text style={[styles.title, { color: textColor }]}>IB Quiz</Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: cardBg }]}>
            <Ionicons name="flame" size={24} color="#FF5722" />
            <Text style={[styles.statValue, { color: textColor }]}>{totalStreak}</Text>
            <Text style={[styles.statLabel, { color: subtextColor }]}>Streak</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: cardBg }]}>
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            <Text style={[styles.statValue, { color: textColor }]}>{Math.round(avgAccuracy * 100)}%</Text>
            <Text style={[styles.statLabel, { color: subtextColor }]}>Accuracy</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: cardBg }]}>
            <Ionicons name="book" size={24} color="#2196F3" />
            <Text style={[styles.statValue, { color: textColor }]}>{totalAttempts}</Text>
            <Text style={[styles.statLabel, { color: subtextColor }]}>Topics</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={[styles.sectionTitle, { color: textColor }]}>Quick Actions</Text>
        <View style={styles.actionsContainer}>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.actionCard, { backgroundColor: cardBg }]}
              onPress={() => router.push(action.route as any)}
            >
              <View style={[styles.actionIcon, { backgroundColor: `${action.color}20` }]}>
                <Ionicons name={action.icon as any} size={28} color={action.color} />
              </View>
              <Text style={[styles.actionTitle, { color: textColor }]}>{action.title}</Text>
              <Text style={[styles.actionDesc, { color: subtextColor }]}>{action.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Progress */}
        {topicProgress.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Recent Progress</Text>
            <View style={[styles.progressList, { backgroundColor: cardBg }]}>
              {topicProgress.slice(0, 5).map((progress, index) => (
                <View key={index} style={styles.progressItem}>
                  <View style={styles.progressInfo}>
                    <Text style={[styles.progressSubject, { color: subtextColor }]}>
                      {SUBJECT_NAMES[progress.subject as Subject] || progress.subject}
                    </Text>
                    <Text style={[styles.progressTopic, { color: textColor }]}>
                      {progress.topic}
                    </Text>
                  </View>
                  <View style={styles.progressStats}>
                    <Text style={[styles.progressAccuracy, { color: activeColor }]}>
                      {Math.round(progress.accuracy * 100)}%
                    </Text>
                    <View style={[styles.masteryBar, { width: `${progress.mastery_level}%`, backgroundColor: activeColor }]} />
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Subjects Overview */}
        <Text style={[styles.sectionTitle, { color: textColor }]}>Subjects</Text>
        <View style={styles.subjectsContainer}>
          {(['math', 'physics', 'chemistry'] as Subject[]).map((subject) => (
            <TouchableOpacity
              key={subject}
              style={[styles.subjectCard, { backgroundColor: cardBg }]}
              onPress={() => router.push({ pathname: '/quiz', params: { subject } })}
            >
              <Ionicons
                name={
                  subject === 'math'
                    ? 'calculator'
                    : subject === 'physics'
                    ? 'planet'
                    : 'flask'
                }
                size={32}
                color={activeColor}
              />
              <Text style={[styles.subjectName, { color: textColor }]}>
                {SUBJECT_NAMES[subject]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
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
    marginBottom: 24,
  },
  greeting: {
    fontSize: 14,
    marginBottom: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  actionDesc: {
    fontSize: 11,
    textAlign: 'center',
  },
  progressList: {
    borderRadius: 16,
    padding: 12,
    marginBottom: 24,
  },
  progressItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E020',
  },
  progressInfo: {
    flex: 1,
  },
  progressSubject: {
    fontSize: 11,
    textTransform: 'uppercase',
  },
  progressTopic: {
    fontSize: 14,
    fontWeight: '500',
  },
  progressStats: {
    alignItems: 'flex-end',
    width: 80,
  },
  progressAccuracy: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  masteryBar: {
    height: 4,
    borderRadius: 2,
    alignSelf: 'flex-end',
    minWidth: 4,
  },
  subjectsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  subjectCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  subjectName: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
  },
});

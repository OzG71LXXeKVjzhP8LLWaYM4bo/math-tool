import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useProgressStore } from '@/stores/progress-store';
import { useSettingsStore, COURSE_NAMES, COURSE_SHORT_NAMES, COURSE_DESCRIPTIONS, type Course } from '@/stores/settings-store';
import { getTopicsForCourse } from '@/constants/topics';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { topicProgress, fetchTopicProgress } = useProgressStore();
  const { course, setCourse, hasCourseSelected } = useSettingsStore();
  const [showCourseModal, setShowCourseModal] = useState(false);

  useEffect(() => {
    // Show course selection on first launch
    if (!hasCourseSelected()) {
      setShowCourseModal(true);
    }
    fetchTopicProgress();
  }, []);

  const handleCourseSelect = (selectedCourse: Course) => {
    setCourse(selectedCourse);
    setShowCourseModal(false);
  };

  const textColor = isDark ? Colors.dark.text : Colors.light.text;
  const subtextColor = isDark ? '#888' : '#666';
  const cardBg = isDark ? '#1E1E1E' : '#FFFFFF';
  const activeColor = isDark ? Colors.dark.tint : Colors.light.tint;

  // Calculate overall stats
  const totalAttempts = topicProgress.reduce((sum, p) => sum + (p.accuracy > 0 ? 1 : 0), 0);
  const avgAccuracy = topicProgress.length > 0
    ? topicProgress.reduce((sum, p) => sum + p.accuracy, 0) / Math.max(topicProgress.length, 1)
    : 0;
  const totalStreak = topicProgress.reduce((max, p) => Math.max(max, p.streak), 0);

  // Get topics for current course
  const topics = course ? getTopicsForCourse(course) : {};
  const topicEntries = Object.entries(topics);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? Colors.dark.background : '#F5F5F5' }]} edges={['top', 'left', 'right']}>
      {/* Course Selection Modal */}
      <Modal
        visible={showCourseModal}
        animationType="fade"
        transparent
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: cardBg }]}>
            <Ionicons name="school" size={48} color={activeColor} />
            <Text style={[styles.modalTitle, { color: textColor }]}>
              Select Your Course
            </Text>
            <Text style={[styles.modalSubtitle, { color: subtextColor }]}>
              Choose your IB Math course to get started
            </Text>

            <TouchableOpacity
              style={[styles.courseOption, { borderColor: activeColor }]}
              onPress={() => handleCourseSelect('aa')}
            >
              <Text style={[styles.courseOptionTitle, { color: textColor }]}>
                Math AA
              </Text>
              <Text style={[styles.courseOptionDesc, { color: subtextColor }]}>
                {COURSE_DESCRIPTIONS.aa}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.courseOption, { borderColor: activeColor }]}
              onPress={() => handleCourseSelect('ai')}
            >
              <Text style={[styles.courseOptionTitle, { color: textColor }]}>
                Math AI
              </Text>
              <Text style={[styles.courseOptionDesc, { color: subtextColor }]}>
                {COURSE_DESCRIPTIONS.ai}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={[styles.greeting, { color: subtextColor }]}>IB Mathematics</Text>
              <Text style={[styles.title, { color: textColor }]}>
                {course ? COURSE_SHORT_NAMES[course] : 'IB Math'}
              </Text>
            </View>
            {course && (
              <TouchableOpacity
                style={[styles.courseBadge, { backgroundColor: `${activeColor}20` }]}
                onPress={() => setShowCourseModal(true)}
              >
                <Text style={[styles.courseBadgeText, { color: activeColor }]}>
                  {course.toUpperCase()}
                </Text>
                <Ionicons name="chevron-down" size={14} color={activeColor} />
              </TouchableOpacity>
            )}
          </View>
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

        {/* Start Quiz Button */}
        <TouchableOpacity
          style={[styles.startButton, { backgroundColor: activeColor }]}
          onPress={() => router.push('/quiz')}
        >
          <Ionicons name="play" size={24} color="#FFFFFF" />
          <Text style={styles.startButtonText}>Start Practice</Text>
        </TouchableOpacity>

        {/* Topics Quick Access */}
        <Text style={[styles.sectionTitle, { color: textColor }]}>Topics</Text>
        <View style={styles.topicsGrid}>
          {topicEntries.map(([key, info]) => (
            <TouchableOpacity
              key={key}
              style={[styles.topicCard, { backgroundColor: cardBg }]}
              onPress={() => router.push({ pathname: '/quiz', params: { topic: info.name } })}
            >
              <Ionicons
                name={
                  key === 'calculus' ? 'analytics' :
                  key === 'functions' ? 'git-branch' :
                  key === 'geometry-trig' ? 'shapes' :
                  key === 'statistics' ? 'bar-chart' :
                  'calculator'
                }
                size={28}
                color={activeColor}
              />
              <Text style={[styles.topicName, { color: textColor }]}>
                {info.name}
              </Text>
              <Text style={[styles.topicCount, { color: subtextColor }]}>
                {info.subtopics.length} subtopics
              </Text>
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    fontSize: 14,
    marginBottom: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  courseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  courseBadgeText: {
    fontSize: 14,
    fontWeight: '600',
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
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 16,
    marginBottom: 24,
    gap: 8,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  topicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  topicCard: {
    width: '47%',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  topicName: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  topicCount: {
    fontSize: 12,
    marginTop: 4,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  courseOption: {
    width: '100%',
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    marginBottom: 12,
  },
  courseOptionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  courseOptionDesc: {
    fontSize: 13,
  },
});

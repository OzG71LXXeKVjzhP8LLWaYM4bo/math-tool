import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TopicSelector } from '@/components/quiz/TopicSelector';
import { useQuizStore } from '@/stores/quiz-store';
import { useProgressStore } from '@/stores/progress-store';
import { useSettingsStore, COURSE_SHORT_NAMES } from '@/stores/settings-store';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { SessionMode, PaperType } from '@/types';
import { PAPER_INFO } from '@/types';

type FlowMode = 'select' | 'setup' | 'topic' | 'resume';

export default function QuizSelectScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { course } = useSettingsStore();

  const { quiz, startQuiz, resumeQuiz, setConfig, isLoading, resetQuiz } = useQuizStore();
  const { quizHistory, fetchQuizHistory, isLoadingHistory } = useProgressStore();

  const [flowMode, setFlowMode] = useState<FlowMode>('select');
  const [sessionMode, setSessionMode] = useState<SessionMode>('quiz');
  const [paperType, setPaperType] = useState<PaperType>('paper1');
  const [questionCount, setQuestionCount] = useState(5);
  const [selections, setSelections] = useState<Array<{ topic: string; subtopic: string }>>([]);

  const textColor = isDark ? Colors.dark.text : Colors.light.text;
  const subtextColor = isDark ? '#888' : '#666';
  const cardBg = isDark ? '#1E1E1E' : '#FFFFFF';
  const activeColor = isDark ? Colors.dark.tint : Colors.light.tint;
  const borderColor = isDark ? '#333' : '#E0E0E0';

  // Fetch quiz history when entering resume mode
  useEffect(() => {
    if (flowMode === 'resume') {
      fetchQuizHistory();
    }
  }, [flowMode]);

  // Navigate to quiz player when quiz starts
  useEffect(() => {
    if (quiz?.id) {
      router.push(`/quiz/${quiz.id}`);
    }
  }, [quiz?.id]);

  // Reset quiz state when returning to select mode
  useEffect(() => {
    if (flowMode === 'select') {
      resetQuiz();
    }
  }, [flowMode]);

  const handleModeSelect = (mode: SessionMode) => {
    setSessionMode(mode);
    setFlowMode('setup');
  };

  const handleSetupContinue = () => {
    setConfig({
      mode: sessionMode,
      paperType,
      questionCount,
    });
    setFlowMode('topic');
  };

  const handleSelectionChange = (newSelections: Array<{ topic: string; subtopic: string }>) => {
    setSelections(newSelections);
  };

  const handleStartQuiz = async () => {
    if (selections.length > 0 && course) {
      // Join all selected subtopics as comma-separated string for the API
      const topicString = selections.map((s) => `${s.topic}: ${s.subtopic}`).join(', ');
      await startQuiz(`math_${course}`, topicString);
    }
  };

  const handleResumeQuiz = async (quizId: string) => {
    await resumeQuiz(quizId);
  };

  const handleBack = () => {
    if (flowMode === 'setup') {
      setFlowMode('select');
    } else if (flowMode === 'topic') {
      setFlowMode('setup');
      setSelections([]);
    } else if (flowMode === 'resume') {
      setFlowMode('select');
    }
  };

  const paperInfo = PAPER_INFO[paperType];
  const estimatedTime = questionCount * paperInfo.timePerQuestion;

  // Mode selection screen
  if (flowMode === 'select') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? Colors.dark.background : '#F5F5F5' }]} edges={['top', 'left', 'right']}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View>
                <Text style={[styles.title, { color: textColor }]}>Practice</Text>
                <Text style={[styles.subtitle, { color: subtextColor }]}>
                  {course ? COURSE_SHORT_NAMES[course] : 'Choose an option'}
                </Text>
              </View>
              <View style={[styles.headerIcon, { backgroundColor: `${activeColor}15` }]}>
                <Ionicons name="school" size={28} color={activeColor} />
              </View>
            </View>
          </View>

          <View style={styles.modeOptions}>
            <TouchableOpacity
              style={[styles.modeCard, { backgroundColor: cardBg }]}
              onPress={() => handleModeSelect('quiz')}
            >
              <View style={[styles.modeIcon, { backgroundColor: `${activeColor}20` }]}>
                <Ionicons name="help-circle" size={32} color={activeColor} />
              </View>
              <Text style={[styles.modeTitle, { color: textColor }]}>Quiz</Text>
              <Text style={[styles.modeDesc, { color: subtextColor }]}>
                Practice with solutions after each question
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeCard, { backgroundColor: cardBg }]}
              onPress={() => handleModeSelect('exam')}
            >
              <View style={[styles.modeIcon, { backgroundColor: '#FF572220' }]}>
                <Ionicons name="timer" size={32} color="#FF5722" />
              </View>
              <Text style={[styles.modeTitle, { color: textColor }]}>Exam</Text>
              <Text style={[styles.modeDesc, { color: subtextColor }]}>
                Timed simulation, solutions at the end
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeCard, { backgroundColor: cardBg }]}
              onPress={() => setFlowMode('resume')}
            >
              <View style={[styles.modeIcon, { backgroundColor: '#FFC10720' }]}>
                <Ionicons name="play-circle" size={32} color="#FFC107" />
              </View>
              <Text style={[styles.modeTitle, { color: textColor }]}>Continue</Text>
              <Text style={[styles.modeDesc, { color: subtextColor }]}>
                Resume a previous session
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Setup screen (paper type + question count)
  if (flowMode === 'setup') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? Colors.dark.background : '#F5F5F5' }]} edges={['top', 'left', 'right']}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color={textColor} />
            <Text style={[styles.backText, { color: textColor }]}>Back</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={[styles.title, { color: textColor }]}>
              {sessionMode === 'exam' ? 'Exam Setup' : 'Quiz Setup'}
            </Text>
            <Text style={[styles.subtitle, { color: subtextColor }]}>
              Configure your {sessionMode === 'exam' ? 'exam' : 'practice'} session
            </Text>
          </View>

          {/* Paper Type Selection */}
          <View style={[styles.section, { backgroundColor: cardBg }]}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Paper Type</Text>
            <View style={styles.paperOptions}>
              {(['paper1', 'paper2', 'paper3'] as PaperType[]).map((paper) => {
                const info = PAPER_INFO[paper];
                const isSelected = paperType === paper;
                return (
                  <TouchableOpacity
                    key={paper}
                    style={[
                      styles.paperOption,
                      { borderColor: isSelected ? activeColor : borderColor },
                      isSelected && { backgroundColor: `${activeColor}10` },
                    ]}
                    onPress={() => setPaperType(paper)}
                  >
                    <View style={styles.paperHeader}>
                      <Text style={[styles.paperName, { color: textColor }]}>{info.name}</Text>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={20} color={activeColor} />
                      )}
                    </View>
                    <View style={styles.paperMeta}>
                      <View style={[styles.paperBadge, { backgroundColor: info.calculator ? '#4CAF5020' : '#FF572220' }]}>
                        <Ionicons
                          name={info.calculator ? 'calculator' : 'calculator-outline'}
                          size={12}
                          color={info.calculator ? '#4CAF50' : '#FF5722'}
                        />
                        <Text style={[styles.paperBadgeText, { color: info.calculator ? '#4CAF50' : '#FF5722' }]}>
                          {info.calculator ? 'Calculator' : 'No Calculator'}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.paperDesc, { color: subtextColor }]}>
                      {info.description}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Question Count */}
          <View style={[styles.section, { backgroundColor: cardBg }]}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Number of Questions</Text>
            <View style={styles.sliderContainer}>
              <Text style={[styles.sliderValue, { color: activeColor }]}>{questionCount}</Text>
              <Slider
                style={styles.slider}
                minimumValue={1}
                maximumValue={10}
                step={1}
                value={questionCount}
                onValueChange={setQuestionCount}
                minimumTrackTintColor={activeColor}
                maximumTrackTintColor={borderColor}
                thumbTintColor={activeColor}
              />
              <View style={styles.sliderLabels}>
                <Text style={[styles.sliderLabel, { color: subtextColor }]}>1</Text>
                <Text style={[styles.sliderLabel, { color: subtextColor }]}>10</Text>
              </View>
            </View>
            {sessionMode === 'exam' && (
              <View style={styles.timeEstimate}>
                <Ionicons name="time-outline" size={16} color={subtextColor} />
                <Text style={[styles.timeEstimateText, { color: subtextColor }]}>
                  Estimated time: {estimatedTime} minutes
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[styles.continueButton, { backgroundColor: activeColor }]}
            onPress={handleSetupContinue}
          >
            <Text style={styles.continueButtonText}>Continue to Topic Selection</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Resume quiz selection
  if (flowMode === 'resume') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? Colors.dark.background : '#F5F5F5' }]} edges={['top', 'left', 'right']}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color={textColor} />
            <Text style={[styles.backText, { color: textColor }]}>Back</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={[styles.title, { color: textColor }]}>Continue</Text>
            <Text style={[styles.subtitle, { color: subtextColor }]}>
              Select a session to resume
            </Text>
          </View>

          {isLoadingHistory ? (
            <View style={[styles.emptyState, { backgroundColor: cardBg }]}>
              <ActivityIndicator size="large" color={activeColor} />
              <Text style={[styles.emptyText, { color: subtextColor, marginTop: 16 }]}>
                Loading sessions...
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
                    onPress={() => handleResumeQuiz(historyItem.id)}
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
              <Text style={[styles.emptyTitle, { color: textColor }]}>No Previous Sessions</Text>
              <Text style={[styles.emptyText, { color: subtextColor }]}>
                Start a new quiz or exam to see it here
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Topic selection
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? Colors.dark.background : '#F5F5F5' }]} edges={['top', 'left', 'right']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={textColor} />
          <Text style={[styles.backText, { color: textColor }]}>Back</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={[styles.title, { color: textColor }]}>Select Topic</Text>
          <Text style={[styles.subtitle, { color: subtextColor }]}>
            {course ? `${COURSE_SHORT_NAMES[course]} · ${PAPER_INFO[paperType].name}` : 'Select a topic'}
          </Text>
        </View>

        {/* Session summary */}
        <View style={[styles.sessionSummary, { backgroundColor: cardBg }]}>
          <View style={styles.summaryItem}>
            <Ionicons
              name={sessionMode === 'exam' ? 'timer' : 'help-circle'}
              size={16}
              color={activeColor}
            />
            <Text style={[styles.summaryText, { color: textColor }]}>
              {sessionMode === 'exam' ? 'Exam Mode' : 'Quiz Mode'}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Ionicons name="document-text" size={16} color={activeColor} />
            <Text style={[styles.summaryText, { color: textColor }]}>
              {questionCount} question{questionCount !== 1 ? 's' : ''}
            </Text>
          </View>
          {sessionMode === 'exam' && (
            <>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Ionicons name="time-outline" size={16} color={activeColor} />
                <Text style={[styles.summaryText, { color: textColor }]}>
                  {estimatedTime} min
                </Text>
              </View>
            </>
          )}
        </View>

        <TopicSelector
          onSelectionChange={handleSelectionChange}
          selections={selections}
        />

        {selections.length > 0 && (
          <TouchableOpacity
            style={[styles.startButton, { backgroundColor: activeColor, opacity: isLoading ? 0.7 : 1 }]}
            onPress={handleStartQuiz}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.startButtonText}>
                  Start {sessionMode === 'exam' ? 'Exam' : 'Quiz'}
                </Text>
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
  contentContainer: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    marginBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
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
  section: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  paperOptions: {
    gap: 12,
  },
  paperOption: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 12,
  },
  paperHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  paperName: {
    fontSize: 16,
    fontWeight: '600',
  },
  paperMeta: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  paperBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  paperBadgeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  paperDesc: {
    fontSize: 13,
  },
  sliderContainer: {
    alignItems: 'center',
    width: '100%',
  },
  sliderValue: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  slider: {
    width: '100%',
    maxWidth: 400,
    height: 40,
    alignSelf: 'center',
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 400,
    paddingHorizontal: 8,
    alignSelf: 'center',
  },
  sliderLabel: {
    fontSize: 12,
  },
  timeEstimate: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
  },
  timeEstimateText: {
    fontSize: 13,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  sessionSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  summaryText: {
    fontSize: 13,
    fontWeight: '500',
  },
  summaryDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 12,
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

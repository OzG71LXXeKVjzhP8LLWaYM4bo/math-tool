import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { TopicSelector } from '@/components/quiz/TopicSelector';
import { QuestionCard } from '@/components/quiz/QuestionCard';
import { AnswerInput } from '@/components/quiz/AnswerInput';
import { LatexRenderer } from '@/components/latex/LatexRenderer';
import { useQuizStore } from '@/stores/quiz-store';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { Subject } from '@/constants/topics';

export default function QuizScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const {
    session,
    currentQuestion,
    questionNumber,
    totalQuestions,
    lastResult,
    isLoading,
    showSolution,
    startQuiz,
    submitAnswer,
    fetchNextQuestion,
    resetQuiz,
    setShowSolution,
  } = useQuizStore();

  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  const textColor = isDark ? Colors.dark.text : Colors.light.text;
  const subtextColor = isDark ? '#888' : '#666';
  const cardBg = isDark ? '#1E1E1E' : '#FFFFFF';
  const activeColor = isDark ? Colors.dark.tint : Colors.light.tint;

  const handleTopicSelect = (subject: Subject, topic: string) => {
    setSelectedSubject(subject);
    setSelectedTopic(topic);
  };

  const handleStartQuiz = () => {
    if (selectedSubject && selectedTopic) {
      startQuiz(selectedSubject, selectedTopic);
    }
  };

  const handleNextQuestion = () => {
    setShowSolution(false);
    fetchNextQuestion();
  };

  const handleBackToTopics = () => {
    resetQuiz();
    setSelectedSubject(null);
    setSelectedTopic(null);
  };

  // Topic selection view
  if (!session) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? Colors.dark.background : '#F5F5F5' }]}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: textColor }]}>Quiz Mode</Text>
            <Text style={[styles.subtitle, { color: subtextColor }]}>
              Select a topic to start practicing
            </Text>
          </View>

          <TopicSelector
            onSelect={handleTopicSelect}
            selectedSubject={selectedSubject || undefined}
            selectedTopic={selectedTopic || undefined}
          />

          {selectedSubject && selectedTopic && (
            <TouchableOpacity
              style={[styles.startButton, { backgroundColor: activeColor }]}
              onPress={handleStartQuiz}
            >
              <Text style={styles.startButtonText}>Start Quiz</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Quiz in progress
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? Colors.dark.background : '#F5F5F5' }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Back button */}
        <TouchableOpacity style={styles.backButton} onPress={handleBackToTopics}>
          <Ionicons name="arrow-back" size={24} color={textColor} />
          <Text style={[styles.backText, { color: textColor }]}>Back to Topics</Text>
        </TouchableOpacity>

        {/* Current Question */}
        {currentQuestion && (
          <QuestionCard
            question={currentQuestion}
            questionNumber={questionNumber}
            totalQuestions={totalQuestions}
          />
        )}

        {/* Answer Input or Result */}
        {!showSolution ? (
          <View style={styles.answerSection}>
            <AnswerInput
              onSubmit={submitAnswer}
              isLoading={isLoading}
              disabled={!currentQuestion}
            />
          </View>
        ) : (
          <View style={[styles.resultCard, { backgroundColor: cardBg }]}>
            {/* Result Header */}
            <View style={styles.resultHeader}>
              <View
                style={[
                  styles.resultIcon,
                  { backgroundColor: lastResult?.isCorrect ? '#4CAF5020' : '#F4433620' },
                ]}
              >
                <Ionicons
                  name={lastResult?.isCorrect ? 'checkmark-circle' : 'close-circle'}
                  size={32}
                  color={lastResult?.isCorrect ? '#4CAF50' : '#F44336'}
                />
              </View>
              <Text
                style={[
                  styles.resultText,
                  { color: lastResult?.isCorrect ? '#4CAF50' : '#F44336' },
                ]}
              >
                {lastResult?.isCorrect ? 'Correct!' : 'Incorrect'}
              </Text>
            </View>

            {/* Correct Answer */}
            {!lastResult?.isCorrect && (
              <View style={styles.correctAnswer}>
                <Text style={[styles.answerLabel, { color: subtextColor }]}>
                  Correct Answer:
                </Text>
                <LatexRenderer latex={lastResult?.correctAnswer || ''} fontSize={18} />
              </View>
            )}

            {/* Solution Steps */}
            {lastResult?.solution && lastResult.solution.length > 0 && (
              <View style={styles.solutionSection}>
                <Text style={[styles.solutionTitle, { color: textColor }]}>Solution</Text>
                {lastResult.solution.map((step, index) => (
                  <View key={index} style={styles.stepItem}>
                    <Text style={[styles.stepNumber, { color: subtextColor }]}>
                      {step.step_number}.
                    </Text>
                    <View style={styles.stepContent}>
                      <Text style={[styles.stepDescription, { color: textColor }]}>
                        {step.description}
                      </Text>
                      <LatexRenderer latex={step.expression_latex} fontSize={16} />
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Next Question Button */}
            <TouchableOpacity
              style={[styles.nextButton, { backgroundColor: activeColor }]}
              onPress={handleNextQuestion}
            >
              <Text style={styles.nextButtonText}>Next Question</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </TouchableOpacity>
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  backText: {
    fontSize: 16,
  },
  answerSection: {
    marginTop: 16,
  },
  resultCard: {
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
  },
  resultHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  resultIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  resultText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  correctAnswer: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E020',
  },
  answerLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  solutionSection: {
    marginBottom: 20,
  },
  solutionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  stepItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
    width: 24,
  },
  stepContent: {
    flex: 1,
  },
  stepDescription: {
    fontSize: 14,
    marginBottom: 4,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

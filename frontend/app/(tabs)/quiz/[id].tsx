import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { QuestionCard } from '@/components/quiz/QuestionCard';
import { AnswerInput } from '@/components/quiz/AnswerInput';
import { LatexRenderer } from '@/components/latex/LatexRenderer';
import { useQuizStore } from '@/stores/quiz-store';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function QuizPlayerScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width, height } = useWindowDimensions();

  const isLandscape = width > height && width > 600;

  const {
    quiz,
    currentQuestion,
    questionNumber,
    totalQuestions,
    lastResult,
    isLoading,
    showSolution,
    submitAnswer,
    fetchNextQuestion,
    resetQuiz,
    setShowSolution,
  } = useQuizStore();

  const textColor = isDark ? Colors.dark.text : Colors.light.text;
  const subtextColor = isDark ? '#888' : '#666';
  const cardBg = isDark ? '#1E1E1E' : '#FFFFFF';
  const activeColor = isDark ? Colors.dark.tint : Colors.light.tint;

  const handleNextQuestion = () => {
    setShowSolution(false);
    fetchNextQuestion();
  };

  const handleExit = () => {
    resetQuiz();
    router.back();
  };

  // Loading state
  if (isLoading && !currentQuestion) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? Colors.dark.background : '#F5F5F5' }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={activeColor} />
          <Text style={[styles.loadingText, { color: subtextColor }]}>
            Loading question...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // No quiz loaded
  if (!quiz || !currentQuestion) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? Colors.dark.background : '#F5F5F5' }]}>
        <View style={styles.loadingContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={subtextColor} />
          <Text style={[styles.loadingText, { color: textColor }]}>
            Quiz not found
          </Text>
          <TouchableOpacity
            style={[styles.exitButton, { backgroundColor: activeColor }]}
            onPress={() => router.back()}
          >
            <Text style={styles.exitButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Render solution content
  const renderSolutionContent = () => (
    <>
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
    </>
  );

  // Portrait layout
  if (!isLandscape) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? Colors.dark.background : '#F5F5F5' }]}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={handleExit}>
              <Ionicons name="close" size={24} color={textColor} />
            </TouchableOpacity>
            <View style={styles.progressInfo}>
              <Text style={[styles.progressText, { color: textColor }]}>
                Question {questionNumber} of {totalQuestions}
              </Text>
            </View>
          </View>

          {/* Question Card */}
          <QuestionCard
            question={currentQuestion}
            questionNumber={questionNumber}
            totalQuestions={totalQuestions}
          />

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
              {renderSolutionContent()}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Landscape layout
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? Colors.dark.background : '#F5F5F5' }]}>
      {/* Header bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backButton} onPress={handleExit}>
          <Ionicons name="close" size={24} color={textColor} />
          <Text style={[styles.backText, { color: textColor }]}>Exit Quiz</Text>
        </TouchableOpacity>
        <Text style={[styles.progressText, { color: textColor }]}>
          Question {questionNumber} of {totalQuestions}
        </Text>
      </View>

      {/* Side by side layout */}
      <View style={styles.landscapeContainer}>
        {/* Left panel - Question */}
        <ScrollView
          style={styles.leftPanel}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.panelContent}
        >
          <QuestionCard
            question={currentQuestion}
            questionNumber={questionNumber}
            totalQuestions={totalQuestions}
          />

          {showSolution && (
            <View style={[styles.resultCard, { backgroundColor: cardBg, marginTop: 16 }]}>
              {renderSolutionContent()}
            </View>
          )}
        </ScrollView>

        {/* Right panel - Input */}
        <View style={[styles.rightPanel, { backgroundColor: cardBg }]}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.panelContent}
          >
            {!showSolution && (
              <AnswerInput
                onSubmit={submitAnswer}
                isLoading={isLoading}
                disabled={!currentQuestion}
              />
            )}
            {showSolution && (
              <View style={styles.waitingNext}>
                <Ionicons name="checkmark-circle" size={48} color={activeColor} />
                <Text style={[styles.waitingText, { color: subtextColor }]}>
                  View solution on the left
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backText: {
    fontSize: 16,
  },
  progressInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  progressText: {
    fontSize: 14,
    fontWeight: '500',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
  },
  exitButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  exitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
  landscapeContainer: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 16,
  },
  leftPanel: {
    flex: 1,
  },
  rightPanel: {
    flex: 1,
    borderRadius: 16,
    maxWidth: 500,
  },
  panelContent: {
    padding: 16,
  },
  waitingNext: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 16,
  },
  waitingText: {
    fontSize: 16,
    textAlign: 'center',
  },
});

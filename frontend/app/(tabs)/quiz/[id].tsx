import React, { useEffect, useState, useCallback } from 'react';
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
import { PAPER_INFO } from '@/types';

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
    config,
    allResults,
    isExamComplete,
    completeExam,
    getRemainingTime,
  } = useQuizStore();

  const isExamMode = config?.mode === 'exam';
  const paperInfo = config?.paperType ? PAPER_INFO[config.paperType] : null;

  const textColor = isDark ? Colors.dark.text : Colors.light.text;
  const subtextColor = isDark ? '#888' : '#666';
  const cardBg = isDark ? '#1E1E1E' : '#FFFFFF';
  const activeColor = isDark ? Colors.dark.tint : Colors.light.tint;

  // Timer state
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const [reviewIndex, setReviewIndex] = useState(0);

  // State for landscape submit button
  const [submitFn, setSubmitFn] = useState<(() => Promise<void>) | null>(null);
  const [canSubmit, setCanSubmit] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Update timer every second for exam mode
  useEffect(() => {
    if (!isExamMode) return;

    const updateTimer = () => {
      const time = getRemainingTime();
      setRemainingTime(time);

      // Auto-complete exam when time runs out
      if (time === 0 && !isExamComplete) {
        completeExam();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [isExamMode, isExamComplete]);

  const handleSubmitReady = useCallback((fn: () => Promise<void>, canSub: boolean, processing: boolean) => {
    setSubmitFn(() => fn);
    setCanSubmit(canSub);
    setIsProcessing(processing);
  }, []);

  const handleNextQuestion = () => {
    setShowSolution(false);

    // In exam mode, check if we've finished all questions
    if (isExamMode && questionNumber >= totalQuestions) {
      completeExam();
    } else {
      fetchNextQuestion();
    }
  };

  // For exam mode, auto-advance after submission
  useEffect(() => {
    if (isExamMode && lastResult === null && !showSolution && !isLoading && questionNumber < totalQuestions) {
      // Check if we just submitted (allResults length increased)
      // This is handled by the submit flow - we'll use a flag instead
    }
  }, [allResults.length]);

  const handleExamSubmit = async (answer: string) => {
    await submitAnswer(answer);
    // In exam mode, auto-advance to next question or complete
    if (questionNumber >= totalQuestions) {
      completeExam();
    } else {
      fetchNextQuestion();
    }
  };

  const handleExit = () => {
    resetQuiz();
    router.back();
  };

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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

  // Exam complete screen
  if (isExamComplete && isExamMode) {
    const correctCount = allResults.filter(r => r.isCorrect).length;
    const percentage = Math.round((correctCount / allResults.length) * 100) || 0;
    const currentReview = allResults[reviewIndex];

    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? Colors.dark.background : '#F5F5F5' }]}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Results Header */}
          <View style={styles.resultsHeader}>
            <Text style={[styles.resultsTitle, { color: textColor }]}>Exam Complete</Text>
            <View style={[styles.scoreCircle, { borderColor: activeColor }]}>
              <Text style={[styles.scoreValue, { color: activeColor }]}>{percentage}%</Text>
              <Text style={[styles.scoreLabel, { color: subtextColor }]}>
                {correctCount}/{allResults.length}
              </Text>
            </View>
          </View>

          {/* Review Section */}
          <View style={[styles.reviewSection, { backgroundColor: cardBg }]}>
            <Text style={[styles.reviewTitle, { color: textColor }]}>Review Answers</Text>

            {/* Question Navigation */}
            <View style={styles.reviewNav}>
              {allResults.map((result, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.reviewDot,
                    { backgroundColor: result.isCorrect ? '#4CAF50' : '#F44336' },
                    reviewIndex === index && styles.reviewDotActive,
                  ]}
                  onPress={() => setReviewIndex(index)}
                >
                  <Text style={styles.reviewDotText}>{index + 1}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Current Review Item */}
            {currentReview && (
              <View style={styles.reviewContent}>
                <View style={styles.reviewStatus}>
                  <Ionicons
                    name={currentReview.isCorrect ? 'checkmark-circle' : 'close-circle'}
                    size={24}
                    color={currentReview.isCorrect ? '#4CAF50' : '#F44336'}
                  />
                  <Text style={[styles.reviewStatusText, {
                    color: currentReview.isCorrect ? '#4CAF50' : '#F44336'
                  }]}>
                    {currentReview.isCorrect ? 'Correct' : 'Incorrect'}
                  </Text>
                </View>

                <Text style={[styles.reviewLabel, { color: subtextColor }]}>Your Answer:</Text>
                <LatexRenderer latex={currentReview.userAnswer || 'No answer'} fontSize={16} />

                {!currentReview.isCorrect && (
                  <>
                    <Text style={[styles.reviewLabel, { color: subtextColor, marginTop: 12 }]}>
                      Correct Answer:
                    </Text>
                    <LatexRenderer latex={currentReview.correctAnswer} fontSize={16} />
                  </>
                )}

                {currentReview.solution && currentReview.solution.length > 0 && (
                  <View style={styles.solutionSection}>
                    <Text style={[styles.solutionTitle, { color: textColor }]}>Solution</Text>
                    {currentReview.solution.map((step, index) => (
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
              </View>
            )}
          </View>

          {/* Exit Button */}
          <TouchableOpacity
            style={[styles.finishButton, { backgroundColor: activeColor }]}
            onPress={handleExit}
          >
            <Text style={styles.finishButtonText}>Finish Review</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Render timer for exam mode
  const renderTimer = () => {
    if (!isExamMode || remainingTime === null) return null;

    const isLowTime = remainingTime < 300; // Less than 5 minutes
    const timerColor = isLowTime ? '#F44336' : subtextColor;

    return (
      <View style={[styles.timerContainer, { backgroundColor: isLowTime ? '#F4433620' : 'transparent' }]}>
        <Ionicons name="time-outline" size={18} color={timerColor} />
        <Text style={[styles.timerText, { color: timerColor }]}>
          {formatTime(remainingTime)}
        </Text>
      </View>
    );
  };

  // Render solution content (for quiz mode)
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

  // Header content with mode indicator
  const renderHeaderContent = () => (
    <>
      <View style={styles.progressInfo}>
        <Text style={[styles.progressText, { color: textColor }]}>
          Question {questionNumber} of {totalQuestions}
        </Text>
        {paperInfo && (
          <View style={[styles.paperBadge, { backgroundColor: paperInfo.calculator ? '#4CAF5015' : '#FF572215' }]}>
            <Ionicons
              name={paperInfo.calculator ? 'calculator' : 'calculator-outline'}
              size={12}
              color={paperInfo.calculator ? '#4CAF50' : '#FF5722'}
            />
            <Text style={[styles.paperBadgeText, { color: paperInfo.calculator ? '#4CAF50' : '#FF5722' }]}>
              {config?.paperType === 'paper1' ? 'P1' : config?.paperType === 'paper2' ? 'P2' : 'P3'}
            </Text>
          </View>
        )}
      </View>
      {renderTimer()}
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
            {renderHeaderContent()}
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
                onSubmit={isExamMode ? handleExamSubmit : submitAnswer}
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
          <Text style={[styles.backText, { color: textColor }]}>
            {isExamMode ? 'Exit Exam' : 'Exit Quiz'}
          </Text>
        </TouchableOpacity>
        <View style={styles.headerRight}>
          {renderHeaderContent()}
        </View>
      </View>

      {/* Side by side layout */}
      <View style={styles.landscapeContainer}>
        {/* Left panel - Question + Submit */}
        <View style={styles.leftPanel}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.panelContent}
            style={styles.leftScrollView}
          >
            <QuestionCard
              question={currentQuestion}
              questionNumber={questionNumber}
              totalQuestions={totalQuestions}
            />

            {showSolution && !isExamMode && (
              <View style={[styles.resultCard, { backgroundColor: cardBg, marginTop: 16 }]}>
                {renderSolutionContent()}
              </View>
            )}
          </ScrollView>

          {/* Submit Button - on left side */}
          {!showSolution && (
            <View style={styles.submitContainer}>
              <TouchableOpacity
                style={[
                  styles.landscapeSubmitButton,
                  { backgroundColor: activeColor },
                  (!canSubmit || isProcessing || isLoading) && styles.buttonDisabled,
                ]}
                onPress={() => submitFn?.()}
                disabled={!canSubmit || isProcessing || isLoading}
              >
                {isProcessing || isLoading ? (
                  <>
                    <ActivityIndicator color="#FFFFFF" size="small" />
                    <Text style={styles.submitText}>Processing...</Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.submitText}>Submit Answer</Text>
                    <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Right panel - Drawing Canvas (full width) */}
        <View style={[styles.rightPanel, { backgroundColor: cardBg }]}>
          {!showSolution ? (
            <AnswerInput
              onSubmit={isExamMode ? handleExamSubmit : submitAnswer}
              isLoading={isLoading}
              disabled={!currentQuestion}
              hideSubmitButton={true}
              onSubmitReady={handleSubmitReady}
              landscapeMode={true}
            />
          ) : (
            <View style={styles.waitingNext}>
              <Ionicons name="checkmark-circle" size={48} color={activeColor} />
              <Text style={[styles.waitingText, { color: subtextColor }]}>
                View solution on the left
              </Text>
            </View>
          )}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
    fontSize: 12,
    fontWeight: '600',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  timerText: {
    fontSize: 16,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
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
    flex: 0.4,
    minWidth: 300,
    maxWidth: 450,
  },
  leftScrollView: {
    flex: 1,
  },
  rightPanel: {
    flex: 1,
    borderRadius: 16,
    padding: 8,
    overflow: 'hidden',
  },
  panelContent: {
    padding: 16,
  },
  submitContainer: {
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  landscapeSubmitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
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
  // Exam results styles
  resultsHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  resultsTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  scoreLabel: {
    fontSize: 14,
  },
  reviewSection: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  reviewTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  reviewNav: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  reviewDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewDotActive: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  reviewDotText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  reviewContent: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E020',
  },
  reviewStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  reviewStatusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  reviewLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  finishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 32,
  },
  finishButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

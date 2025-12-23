import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';
import { DrawingCanvas } from '@/components/canvas/DrawingCanvas';
import { ToolPalette } from '@/components/canvas/ToolPalette';
import { CanvasControls } from '@/components/canvas/CanvasControls';
import { LatexRenderer } from '@/components/latex/LatexRenderer';
import { useCanvasStore } from '@/stores/canvas-store';
import { api } from '@/services/api';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { SolutionStep } from '@/types';

const { width: screenWidth } = Dimensions.get('window');

export default function WriteScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const canvasRef = useRef<View>(null);
  const { strokes, clear } = useCanvasStore();

  const [isLoading, setIsLoading] = useState(false);
  const [recognizedLatex, setRecognizedLatex] = useState<string | null>(null);
  const [solution, setSolution] = useState<{
    answer: string;
    steps: SolutionStep[];
  } | null>(null);

  const textColor = isDark ? Colors.dark.text : Colors.light.text;
  const subtextColor = isDark ? '#888' : '#666';
  const cardBg = isDark ? '#1E1E1E' : '#FFFFFF';

  const handleSolve = async () => {
    if (strokes.length === 0) {
      Alert.alert('Empty Canvas', 'Please draw something first.');
      return;
    }

    setIsLoading(true);
    setRecognizedLatex(null);
    setSolution(null);

    try {
      // For now, use a placeholder since we need react-native-view-shot
      // In production, capture the canvas as base64 and send to OCR

      // Simulate OCR result for demo
      const demoLatex = 'x^2 + 2x - 3 = 0';
      setRecognizedLatex(demoLatex);

      // Get solution
      const solveResponse = await api.solve({
        expression_latex: demoLatex,
        operation: 'solve',
      });

      if (solveResponse.success) {
        setSolution({
          answer: solveResponse.answer_latex,
          steps: solveResponse.steps,
        });
      } else {
        Alert.alert('Error', solveResponse.error || 'Failed to solve');
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Failed to process the image. Make sure the backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    clear();
    setRecognizedLatex(null);
    setSolution(null);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? Colors.dark.background : '#F5F5F5' }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: textColor }]}>Write & Solve</Text>
          <Text style={[styles.subtitle, { color: subtextColor }]}>
            Draw your equation and tap Solve
          </Text>
        </View>

        {/* Drawing Canvas */}
        <View ref={canvasRef} collapsable={false}>
          <DrawingCanvas
            width={screenWidth - 32}
            height={300}
            showGrid={true}
          />
        </View>

        {/* Tool Palette */}
        <ToolPalette />

        {/* Controls */}
        <CanvasControls
          onSolve={handleSolve}
          isLoading={isLoading}
          disabled={strokes.length === 0}
        />

        {/* Recognized LaTeX */}
        {recognizedLatex && (
          <View style={[styles.resultCard, { backgroundColor: cardBg }]}>
            <Text style={[styles.resultTitle, { color: textColor }]}>Recognized Expression</Text>
            <LatexRenderer latex={recognizedLatex} fontSize={22} />
          </View>
        )}

        {/* Solution */}
        {solution && (
          <View style={[styles.resultCard, { backgroundColor: cardBg }]}>
            <Text style={[styles.resultTitle, { color: textColor }]}>Solution</Text>
            <LatexRenderer latex={solution.answer} fontSize={22} />

            {solution.steps.length > 0 && (
              <View style={styles.stepsContainer}>
                <Text style={[styles.stepsTitle, { color: subtextColor }]}>Steps:</Text>
                {solution.steps.map((step, index) => (
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
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  resultCard: {
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  stepsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E020',
  },
  stepsTitle: {
    fontSize: 14,
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
});

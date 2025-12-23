import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { LatexRenderer } from '@/components/latex/LatexRenderer';
import { api } from '@/services/api';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { SolutionStep } from '@/types';

export default function UploadScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [image, setImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [recognizedLatex, setRecognizedLatex] = useState<string | null>(null);
  const [solution, setSolution] = useState<{
    answer: string;
    steps: SolutionStep[];
  } | null>(null);

  const textColor = isDark ? Colors.dark.text : Colors.light.text;
  const subtextColor = isDark ? '#888' : '#666';
  const cardBg = isDark ? '#1E1E1E' : '#FFFFFF';
  const activeColor = isDark ? Colors.dark.tint : Colors.light.tint;

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      setImage(result.assets[0].uri);
      setRecognizedLatex(null);
      setSolution(null);

      // Process the image
      if (result.assets[0].base64) {
        processImage(result.assets[0].base64);
      }
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permission is required to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 1,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      setImage(result.assets[0].uri);
      setRecognizedLatex(null);
      setSolution(null);

      if (result.assets[0].base64) {
        processImage(result.assets[0].base64);
      }
    }
  };

  const processImage = async (base64: string) => {
    setIsLoading(true);

    try {
      // Call OCR endpoint
      const ocrResponse = await api.ocr(base64);

      if (ocrResponse.success && ocrResponse.latex) {
        setRecognizedLatex(ocrResponse.latex);
      } else {
        Alert.alert('OCR Error', ocrResponse.error || 'Failed to recognize text');
      }
    } catch (error) {
      console.error('OCR Error:', error);
      Alert.alert('Error', 'Failed to process image. Make sure the backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSolve = async () => {
    if (!recognizedLatex) return;

    setIsLoading(true);

    try {
      const solveResponse = await api.solve({
        expression_latex: recognizedLatex,
        operation: 'solve',
      });

      if (solveResponse.success) {
        setSolution({
          answer: solveResponse.answer_latex,
          steps: solveResponse.steps,
        });
      } else {
        Alert.alert('Solve Error', solveResponse.error || 'Failed to solve');
      }
    } catch (error) {
      console.error('Solve Error:', error);
      Alert.alert('Error', 'Failed to solve. Make sure the backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setImage(null);
    setRecognizedLatex(null);
    setSolution(null);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? Colors.dark.background : '#F5F5F5' }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: textColor }]}>Upload Image</Text>
          <Text style={[styles.subtitle, { color: subtextColor }]}>
            Take a photo or upload an image of your problem
          </Text>
        </View>

        {/* Image Selection */}
        {!image ? (
          <View style={styles.uploadOptions}>
            <TouchableOpacity
              style={[styles.uploadButton, { backgroundColor: cardBg }]}
              onPress={takePhoto}
            >
              <View style={[styles.uploadIcon, { backgroundColor: `${activeColor}20` }]}>
                <Ionicons name="camera" size={32} color={activeColor} />
              </View>
              <Text style={[styles.uploadText, { color: textColor }]}>Take Photo</Text>
              <Text style={[styles.uploadHint, { color: subtextColor }]}>
                Use your camera
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.uploadButton, { backgroundColor: cardBg }]}
              onPress={pickImage}
            >
              <View style={[styles.uploadIcon, { backgroundColor: `${activeColor}20` }]}>
                <Ionicons name="images" size={32} color={activeColor} />
              </View>
              <Text style={[styles.uploadText, { color: textColor }]}>Gallery</Text>
              <Text style={[styles.uploadHint, { color: subtextColor }]}>
                Choose from photos
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Preview */}
            <View style={[styles.previewContainer, { backgroundColor: cardBg }]}>
              <Image source={{ uri: image }} style={styles.previewImage} />
              <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
                <Ionicons name="close-circle" size={28} color="#F44336" />
              </TouchableOpacity>
            </View>

            {/* Loading */}
            {isLoading && (
              <View style={[styles.loadingCard, { backgroundColor: cardBg }]}>
                <Text style={[styles.loadingText, { color: textColor }]}>Processing...</Text>
              </View>
            )}

            {/* Recognized LaTeX */}
            {recognizedLatex && !isLoading && (
              <View style={[styles.resultCard, { backgroundColor: cardBg }]}>
                <Text style={[styles.resultTitle, { color: textColor }]}>
                  Recognized Expression
                </Text>
                <LatexRenderer latex={recognizedLatex} fontSize={22} />

                {!solution && (
                  <TouchableOpacity
                    style={[styles.solveButton, { backgroundColor: activeColor }]}
                    onPress={handleSolve}
                  >
                    <Text style={styles.solveButtonText}>Solve</Text>
                    <Ionicons name="calculator" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                )}
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  uploadOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  uploadButton: {
    flex: 1,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  uploadIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  uploadHint: {
    fontSize: 12,
  },
  previewContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: 250,
    resizeMode: 'contain',
  },
  clearButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'white',
    borderRadius: 14,
  },
  loadingCard: {
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
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
  solveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  solveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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

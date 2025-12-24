import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import ViewShot from 'react-native-view-shot';
import { Ionicons } from '@expo/vector-icons';
import { DrawingCanvas } from './DrawingCanvas';
import { CanvasToolbar } from './CanvasToolbar';
import { ImageCapture } from './ImageCapture';
import { LatexRenderer } from '@/components/latex/LatexRenderer';
import { useOcr } from '@/hooks/use-ocr';
import { useCanvasStore } from '@/stores/canvas-store';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

type InputMode = 'draw' | 'camera';

interface HandwritingInputProps {
  onSubmit: (latex: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export function HandwritingInput({
  onSubmit,
  isLoading = false,
  disabled = false,
}: HandwritingInputProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { width, height } = useWindowDimensions();

  const [mode, setMode] = useState<InputMode>('draw');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const viewShotRef = useRef<ViewShot>(null);

  const { recognizedLatex, isProcessing, error, processImage, reset } = useOcr();
  const { clear: clearCanvas, strokes } = useCanvasStore();

  const textColor = isDark ? Colors.dark.text : Colors.light.text;
  const subtextColor = isDark ? '#888' : '#666';
  const activeColor = isDark ? Colors.dark.tint : Colors.light.tint;
  const errorColor = '#DC2626';

  // Calculate canvas height based on screen size
  const isLandscape = width > height;
  const canvasHeight = isLandscape ? Math.min(height - 200, 400) : Math.min(height * 0.4, 350);

  const handleSubmit = async () => {
    if (isProcessing || isLoading || disabled) return;

    if (mode === 'draw') {
      if (!viewShotRef.current || strokes.length === 0) return;

      try {
        const uri = await viewShotRef.current.capture?.();
        if (uri) {
          const response = await fetch(uri);
          const blob = await response.blob();
          const reader = new FileReader();
          reader.onloadend = async () => {
            const base64 = (reader.result as string).split(',')[1];
            if (base64) {
              const latex = await processImage(base64);
              if (latex) {
                onSubmit(latex);
                handleClear();
              }
            }
          };
          reader.readAsDataURL(blob);
        }
      } catch (err) {
        console.error('Failed to capture canvas:', err);
      }
    } else if (capturedImage) {
      const latex = await processImage(capturedImage);
      if (latex) {
        onSubmit(latex);
        handleClear();
      }
    }
  };

  const handleClear = () => {
    reset();
    clearCanvas();
    setCapturedImage(null);
  };

  const handleImageCaptured = async (base64: string) => {
    setCapturedImage(base64);
    // Auto-submit after capturing
    const latex = await processImage(base64);
    if (latex) {
      onSubmit(latex);
      handleClear();
    }
  };

  const canSubmit = mode === 'draw' ? strokes.length > 0 : !!capturedImage;

  return (
    <View style={styles.container}>
      {/* Mode Selector */}
      <View style={styles.modeSelector}>
        <TouchableOpacity
          style={[
            styles.modeButton,
            mode === 'draw' && { backgroundColor: `${activeColor}20` },
          ]}
          onPress={() => {
            setMode('draw');
            setCapturedImage(null);
            reset();
          }}
        >
          <Ionicons
            name="pencil"
            size={20}
            color={mode === 'draw' ? activeColor : subtextColor}
          />
          <Text
            style={[
              styles.modeText,
              { color: mode === 'draw' ? activeColor : subtextColor },
            ]}
          >
            Draw
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.modeButton,
            mode === 'camera' && { backgroundColor: `${activeColor}20` },
          ]}
          onPress={() => {
            setMode('camera');
            clearCanvas();
            reset();
          }}
        >
          <Ionicons
            name="camera"
            size={20}
            color={mode === 'camera' ? activeColor : subtextColor}
          />
          <Text
            style={[
              styles.modeText,
              { color: mode === 'camera' ? activeColor : subtextColor },
            ]}
          >
            Photo
          </Text>
        </TouchableOpacity>
      </View>

      {/* Input Area */}
      {mode === 'draw' ? (
        <View style={styles.drawSection}>
          <ViewShot
            ref={viewShotRef}
            options={{ format: 'png', quality: 0.9, result: 'tmpfile' }}
          >
            <DrawingCanvas height={canvasHeight} showGrid={true} />
          </ViewShot>
          <CanvasToolbar />
        </View>
      ) : (
        <ImageCapture
          onImageCaptured={handleImageCaptured}
          capturedImage={capturedImage}
          onClear={() => {
            setCapturedImage(null);
            reset();
          }}
          disabled={isProcessing}
        />
      )}

      {/* Error Display */}
      {error && (
        <View style={[styles.errorContainer, { backgroundColor: `${errorColor}15` }]}>
          <Ionicons name="warning" size={18} color={errorColor} />
          <Text style={[styles.errorText, { color: errorColor }]}>{error}</Text>
        </View>
      )}

      {/* Submit Button */}
      {mode === 'draw' && (
        <TouchableOpacity
          style={[
            styles.submitButton,
            { backgroundColor: activeColor },
            (!canSubmit || isProcessing || isLoading || disabled) && styles.buttonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!canSubmit || isProcessing || isLoading || disabled}
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
      )}

      {/* Processing indicator for camera mode */}
      {mode === 'camera' && isProcessing && (
        <View style={styles.processingContainer}>
          <ActivityIndicator color={activeColor} size="large" />
          <Text style={[styles.processingText, { color: subtextColor }]}>
            Recognizing handwriting...
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modeSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
  },
  modeText: {
    fontSize: 15,
    fontWeight: '600',
  },
  drawSection: {
    flex: 1,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 12,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  processingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 24,
  },
  processingText: {
    fontSize: 15,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
  },
  errorText: {
    fontSize: 14,
    flex: 1,
  },
});

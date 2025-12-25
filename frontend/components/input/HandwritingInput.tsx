import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { ImageFormat } from '@shopify/react-native-skia';
import { Ionicons } from '@expo/vector-icons';
import { DrawingCanvas } from './DrawingCanvas';
import { ImageCapture } from './ImageCapture';
import { useOcr } from '@/hooks/use-ocr';
import { useCanvasStore } from '@/stores/canvas-store';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

type InputMode = 'draw' | 'camera';

interface HandwritingInputProps {
  onSubmit: (latex: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  hideSubmitButton?: boolean;
  onSubmitReady?: (submitFn: () => Promise<void>, canSubmit: boolean, isProcessing: boolean) => void;
  landscapeMode?: boolean; // Use full-height canvas with collapsible toolbar
}

export function HandwritingInput({
  onSubmit,
  isLoading = false,
  disabled = false,
  hideSubmitButton = false,
  onSubmitReady,
  landscapeMode = false,
}: HandwritingInputProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { width, height } = useWindowDimensions();

  const [mode, setMode] = useState<InputMode>('draw');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const canvasRef = useRef<ReturnType<typeof import('@shopify/react-native-skia').useCanvasRef>['current']>(null);

  // Callback to receive canvas ref from DrawingCanvas
  const handleCanvasReady = useCallback((ref: ReturnType<typeof import('@shopify/react-native-skia').useCanvasRef>) => {
    canvasRef.current = ref.current;
  }, []);

  const { recognizedLatex, isProcessing, error, processImage, reset } = useOcr();
  const { clear: clearCanvas, strokes } = useCanvasStore();

  const textColor = isDark ? Colors.dark.text : Colors.light.text;
  const subtextColor = isDark ? '#888' : '#666';
  const activeColor = isDark ? Colors.dark.tint : Colors.light.tint;
  const errorColor = '#DC2626';

  // Calculate canvas height based on screen size (for non-landscape mode)
  const isLandscape = width > height;
  const canvasHeight = isLandscape ? Math.min(height - 200, 400) : Math.min(height * 0.4, 350);


  const handleModeChange = (newMode: InputMode) => {
    if (newMode === 'draw') {
      setCapturedImage(null);
      reset();
    } else {
      clearCanvas();
      reset();
    }
    setMode(newMode);
  };

  const handleSubmit = async () => {
    if (isProcessing || isLoading || disabled) return;

    if (mode === 'draw') {
      if (!canvasRef.current || strokes.length === 0) return;

      try {
        // Use Skia's native snapshot for better performance
        const image = canvasRef.current.makeImageSnapshot();
        if (image) {
          const base64 = image.encodeToBase64(ImageFormat.PNG, 100);
          if (base64) {
            const latex = await processImage(base64);
            if (latex) {
              onSubmit(latex);
              handleClear();
            }
          }
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

  // Notify parent about submit state
  useEffect(() => {
    if (onSubmitReady) {
      onSubmitReady(handleSubmit, canSubmit, isProcessing);
    }
  }, [canSubmit, isProcessing, onSubmitReady]);

  // Landscape mode - full canvas with built-in floating toolbar
  if (landscapeMode) {
    return (
      <View style={styles.landscapeContainer}>
        {/* Canvas Area - fills space with integrated toolbar */}
        <View style={styles.landscapeCanvasWrapper}>
          <DrawingCanvas
            showGrid={true}
            flexFill={true}
            showToolbar={true}
            onCanvasReady={handleCanvasReady}
          />
        </View>

        {/* Error Display */}
        {error && (
          <View style={[styles.errorContainer, { backgroundColor: `${errorColor}15` }]}>
            <Ionicons name="warning" size={18} color={errorColor} />
            <Text style={[styles.errorText, { color: errorColor }]}>{error}</Text>
          </View>
        )}
      </View>
    );
  }

  // Portrait/default mode with traditional layout
  return (
    <View style={styles.container}>
      {/* Mode Selector */}
      <View style={styles.modeSelector}>
        <TouchableOpacity
          style={[
            styles.modeButton,
            mode === 'draw' && { backgroundColor: `${activeColor}20` },
          ]}
          onPress={() => handleModeChange('draw')}
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
          onPress={() => handleModeChange('camera')}
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
          <DrawingCanvas
            height={canvasHeight}
            showGrid={true}
            showToolbar={true}
            onCanvasReady={handleCanvasReady}
          />
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
      {mode === 'draw' && !hideSubmitButton && (
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

  // Landscape mode styles
  landscapeContainer: {
    flex: 1,
  },
  landscapeCanvasWrapper: {
    flex: 1,
  },
});

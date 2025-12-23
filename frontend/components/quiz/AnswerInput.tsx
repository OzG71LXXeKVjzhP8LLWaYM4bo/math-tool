import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Text,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface AnswerInputProps {
  onSubmit: (answer: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export function AnswerInput({
  onSubmit,
  isLoading = false,
  disabled = false,
  placeholder = 'Enter your answer (LaTeX supported)',
}: AnswerInputProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [answer, setAnswer] = useState('');

  const textColor = isDark ? Colors.dark.text : Colors.light.text;
  const bgColor = isDark ? '#2A2A2A' : '#F5F5F5';
  const borderColor = isDark ? '#444' : '#E0E0E0';
  const activeColor = isDark ? Colors.dark.tint : Colors.light.tint;

  const handleSubmit = () => {
    if (answer.trim() && !disabled && !isLoading) {
      onSubmit(answer.trim());
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.inputContainer, { backgroundColor: bgColor, borderColor }]}>
        <TextInput
          style={[styles.input, { color: textColor }]}
          value={answer}
          onChangeText={setAnswer}
          placeholder={placeholder}
          placeholderTextColor={isDark ? '#666' : '#999'}
          multiline
          editable={!disabled && !isLoading}
          onSubmitEditing={handleSubmit}
        />
      </View>

      <View style={styles.helpText}>
        <Ionicons name="information-circle-outline" size={16} color="#888" />
        <Text style={styles.helpTextContent}>
          Use LaTeX notation: x^2, \frac{"{a}{b}"}, \sqrt{"{x}"}
        </Text>
      </View>

      <TouchableOpacity
        style={[
          styles.submitButton,
          { backgroundColor: activeColor },
          (disabled || isLoading || !answer.trim()) && styles.disabled,
        ]}
        onPress={handleSubmit}
        disabled={disabled || isLoading || !answer.trim()}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <Text style={styles.submitText}>Submit Answer</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  inputContainer: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    minHeight: 100,
  },
  input: {
    fontSize: 16,
    lineHeight: 24,
    textAlignVertical: 'top',
  },
  helpText: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  helpTextContent: {
    fontSize: 12,
    color: '#888',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.5,
  },
});

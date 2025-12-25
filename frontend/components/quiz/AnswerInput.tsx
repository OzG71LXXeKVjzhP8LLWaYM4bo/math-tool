import React from 'react';
import { HandwritingInput } from '@/components/input/HandwritingInput';

interface AnswerInputProps {
  onSubmit: (answer: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  hideSubmitButton?: boolean;
  onSubmitReady?: (submitFn: () => Promise<void>, canSubmit: boolean, isProcessing: boolean) => void;
  landscapeMode?: boolean;
}

export function AnswerInput({
  onSubmit,
  isLoading = false,
  disabled = false,
  hideSubmitButton = false,
  onSubmitReady,
  landscapeMode = false,
}: AnswerInputProps) {
  return (
    <HandwritingInput
      onSubmit={onSubmit}
      isLoading={isLoading}
      disabled={disabled}
      hideSubmitButton={hideSubmitButton}
      onSubmitReady={onSubmitReady}
      landscapeMode={landscapeMode}
    />
  );
}

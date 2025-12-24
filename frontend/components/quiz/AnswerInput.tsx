import React from 'react';
import { HandwritingInput } from '@/components/input/HandwritingInput';

interface AnswerInputProps {
  onSubmit: (answer: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export function AnswerInput({
  onSubmit,
  isLoading = false,
  disabled = false,
}: AnswerInputProps) {
  return (
    <HandwritingInput
      onSubmit={onSubmit}
      isLoading={isLoading}
      disabled={disabled}
    />
  );
}

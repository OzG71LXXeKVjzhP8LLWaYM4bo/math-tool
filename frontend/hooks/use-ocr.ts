import { useState, useCallback } from 'react';
import { api } from '@/services/api';

interface UseOcrReturn {
  recognizedLatex: string | null;
  isProcessing: boolean;
  error: string | null;
  processImage: (base64: string) => Promise<string | null>;
  reset: () => void;
}

export function useOcr(): UseOcrReturn {
  const [recognizedLatex, setRecognizedLatex] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processImage = useCallback(async (base64: string): Promise<string | null> => {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await api.ocr(base64);
      if (response.success && response.latex) {
        setRecognizedLatex(response.latex);
        return response.latex;
      } else {
        const errorMsg = response.error || 'Failed to recognize handwriting';
        setError(errorMsg);
        return null;
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'OCR failed';
      setError(errorMsg);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const reset = useCallback(() => {
    setRecognizedLatex(null);
    setError(null);
  }, []);

  return { recognizedLatex, isProcessing, error, processImage, reset };
}

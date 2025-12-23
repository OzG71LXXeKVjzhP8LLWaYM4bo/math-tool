import { API_BASE_URL, ENDPOINTS } from '@/constants/api';
import type {
  OcrRequest,
  OcrResponse,
  SolveRequest,
  SolveResponse,
  GenerateQuestionRequest,
  GenerateQuestionResponse,
  QuizNextRequest,
  QuizNextResponse,
  QuizSubmitRequest,
  QuizSubmitResponse,
  Progress,
  TopicProgress,
} from '@/types';

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP error ${response.status}`);
    }

    return response.json();
  }

  // Health check
  async health(): Promise<{ status: string; version: string }> {
    return this.request('/health');
  }

  // OCR - Convert image to LaTeX
  async ocr(imageBase64: string): Promise<OcrResponse> {
    return this.request<OcrResponse>(ENDPOINTS.ocr, {
      method: 'POST',
      body: JSON.stringify({ image_base64: imageBase64 } as OcrRequest),
    });
  }

  // Solve - Solve mathematical expression
  async solve(request: SolveRequest): Promise<SolveResponse> {
    return this.request<SolveResponse>(ENDPOINTS.solve, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Generate questions
  async generateQuestion(request: GenerateQuestionRequest): Promise<GenerateQuestionResponse> {
    return this.request<GenerateQuestionResponse>(ENDPOINTS.generateQuestion, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Quiz - Get next question
  async getNextQuestion(request: QuizNextRequest): Promise<QuizNextResponse> {
    const params = new URLSearchParams({
      subject: request.subject,
      topic: request.topic,
      ...(request.session_id && { session_id: request.session_id }),
    });

    return this.request<QuizNextResponse>(`${ENDPOINTS.quizNext}?${params}`);
  }

  // Quiz - Submit answer
  async submitAnswer(request: QuizSubmitRequest): Promise<QuizSubmitResponse> {
    return this.request<QuizSubmitResponse>(ENDPOINTS.quizSubmit, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Progress - Get all progress
  async getProgress(subject?: string, topic?: string): Promise<{ progress: Progress[] }> {
    const params = new URLSearchParams();
    if (subject) params.append('subject', subject);
    if (topic) params.append('topic', topic);

    const query = params.toString();
    return this.request<{ progress: Progress[] }>(
      `${ENDPOINTS.progress}${query ? `?${query}` : ''}`
    );
  }

  // Progress - Get topic-level progress
  async getTopicProgress(): Promise<TopicProgress[]> {
    return this.request<TopicProgress[]>(ENDPOINTS.progressTopics);
  }
}

// Export singleton instance
export const api = new ApiService();

// Export class for custom instances
export { ApiService };

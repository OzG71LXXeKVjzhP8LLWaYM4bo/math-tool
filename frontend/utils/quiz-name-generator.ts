import type { PaperType, Course } from '@/types';

interface TopicSelection {
  topic: string;
  subtopic: string;
}

interface QuizNameGeneratorInput {
  selections: TopicSelection[];
  paperType?: PaperType;
  course?: Course;
}

// Shorten long topic names for display
const TOPIC_SHORT_NAMES: Record<string, string> = {
  'Number and Algebra': 'Algebra',
  'Number & Algebra': 'Algebra',
  'Geometry and Trigonometry': 'Geometry & Trig',
  'Geometry & Trigonometry': 'Geometry & Trig',
  'Statistics and Probability': 'Statistics',
  'Statistics & Probability': 'Statistics',
};

function shortenTopic(fullName: string): string {
  // Remove leading numbers like "1. " or "5. "
  const cleaned = fullName.replace(/^\d+\.\s*/, '');
  return TOPIC_SHORT_NAMES[cleaned] || cleaned;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Generate a smart, concise quiz name based on selected topics
 *
 * Examples:
 * - "Calculus Mix" (multiple subtopics from one topic)
 * - "Full Review - Dec 26" (4+ topics selected)
 * - "Algebra & Functions" (2 topics)
 * - "Calculus, Algebra, Functions" (3 topics)
 */
export function generateSmartQuizName(input: QuizNameGeneratorInput): string {
  const { selections, paperType } = input;

  if (selections.length === 0) {
    return 'New Quiz';
  }

  // Get unique top-level topics
  const uniqueTopics = [...new Set(selections.map((s) => s.topic))];
  const topicCount = uniqueTopics.length;

  // Pattern 1: Full Review (4+ topics selected)
  if (topicCount >= 4) {
    const date = formatDate(new Date());
    return `Full Review - ${date}`;
  }

  // Pattern 2: Single topic with subtopics
  if (topicCount === 1) {
    const topicName = shortenTopic(uniqueTopics[0]);
    const subtopicCount = selections.length;

    // If only one subtopic, use the subtopic name
    if (subtopicCount === 1) {
      return selections[0].subtopic;
    }

    // Multiple subtopics from same topic
    return `${topicName} Mix`;
  }

  // Pattern 3: Two topics - join them
  if (topicCount === 2) {
    const names = uniqueTopics.map(shortenTopic);
    return `${names[0]} & ${names[1]}`;
  }

  // Pattern 4: Three topics - comma-separated
  if (topicCount === 3) {
    const names = uniqueTopics.map(shortenTopic);
    return names.join(', ');
  }

  // Fallback
  return shortenTopic(uniqueTopics[0]);
}

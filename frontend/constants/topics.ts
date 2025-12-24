// IB Math AA/AI Topics

import type { Course } from '@/stores/settings-store';

export interface TopicInfo {
  name: string;
  subtopics: string[];
}

export interface TopicMap {
  [category: string]: TopicInfo;
}

// IB Math Analysis & Approaches (AA) - HL
// More rigorous algebra, proofs, and theoretical focus
export const AA_TOPICS: TopicMap = {
  'number-algebra': {
    name: 'Number & Algebra',
    subtopics: [
      'Sequences & Series',
      'Logarithms & Exponents',
      'Complex Numbers',
      'Mathematical Proof',
      'Binomial Theorem',
    ],
  },
  'functions': {
    name: 'Functions',
    subtopics: [
      'Transformations',
      'Composite & Inverse',
      'Quadratic Functions',
      'Polynomial Functions',
      'Rational Functions',
    ],
  },
  'geometry-trig': {
    name: 'Geometry & Trigonometry',
    subtopics: [
      'Trigonometric Identities',
      'Sine & Cosine Rules',
      'Circular Functions',
      'Vectors',
      '3D Geometry',
    ],
  },
  'statistics': {
    name: 'Statistics & Probability',
    subtopics: [
      'Probability',
      'Binomial Distribution',
      'Normal Distribution',
      'Regression',
    ],
  },
  'calculus': {
    name: 'Calculus',
    subtopics: [
      'Differentiation',
      'Integration',
      'Differential Equations',
      'Optimization',
      'Kinematics',
    ],
  },
};

// IB Math Applications & Interpretation (AI) - HL
// Applied focus, modeling, technology-oriented
export const AI_TOPICS: TopicMap = {
  'number-algebra': {
    name: 'Number & Algebra',
    subtopics: [
      'Sequences & Series',
      'Loans & Amortization',
      'Modelling with Functions',
      'Approximation & Error',
    ],
  },
  'functions': {
    name: 'Functions',
    subtopics: [
      'Linear Models',
      'Exponential Models',
      'Logistic Models',
      'Piecewise Functions',
    ],
  },
  'geometry-trig': {
    name: 'Geometry & Trigonometry',
    subtopics: [
      'Voronoi Diagrams',
      'Graph Theory',
      'Trigonometric Models',
      'Vectors in Applications',
    ],
  },
  'statistics': {
    name: 'Statistics & Probability',
    subtopics: [
      'Descriptive Statistics',
      'Probability',
      'Statistical Tests',
      'Chi-Squared Tests',
      'Regression Analysis',
    ],
  },
  'calculus': {
    name: 'Calculus',
    subtopics: [
      'Differentiation',
      'Integration',
      'Optimization',
      'Modelling with Calculus',
    ],
  },
};

// Get topics for selected course
export function getTopicsForCourse(course: Course): TopicMap {
  return course === 'aa' ? AA_TOPICS : AI_TOPICS;
}

// Get all topic keys
export function getTopicKeys(course: Course): string[] {
  return Object.keys(getTopicsForCourse(course));
}

// Get topic display name
export function getTopicName(course: Course, topicKey: string): string {
  const topics = getTopicsForCourse(course);
  return topics[topicKey]?.name ?? topicKey;
}

// Get subtopics for a topic
export function getSubtopics(course: Course, topicKey: string): string[] {
  const topics = getTopicsForCourse(course);
  return topics[topicKey]?.subtopics ?? [];
}

// Flatten all topics for API calls
export function getAllSubtopics(course: Course): { topic: string; subtopic: string }[] {
  const topics = getTopicsForCourse(course);
  const result: { topic: string; subtopic: string }[] = [];

  for (const [key, info] of Object.entries(topics)) {
    for (const subtopic of info.subtopics) {
      result.push({ topic: info.name, subtopic });
    }
  }

  return result;
}

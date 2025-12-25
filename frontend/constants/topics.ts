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
    name: '1. Number and Algebra',
    subtopics: [
      'Scientific Notation',
      'Arithmetic Sequences',
      'Geometric Sequences',
      'Financial Applications',
      'Exponents & Logarithms',
      'Simple Deductive Proof',
      'Binomial Theorem',
      'Counting Principles',
      'Binomial Theorem (Extended)',
      'Partial Fractions',
      'Complex Numbers',
      'Complex Number Forms',
      "De Moivre's Theorem",
      'Proof by Induction',
      'Proof by Contradiction',
      'Proof by Counterexample',
      'Systems of Linear Equations',
    ],
  },
  'functions': {
    name: '2. Functions',
    subtopics: [
      'Function Properties',
      'Graphing Functions',
      'Composite & Inverse Functions',
      'Quadratics',
      'Rational Functions',
      'Exponential & Logarithmic Functions',
      'Solving Equations Graphically',
      'Graph Transformations',
      'Polynomials',
      'Further Rational Functions',
      'Odd & Even Functions',
      'Function Inequalities',
      'Modulus Functions & Equations',
    ],
  },
  'geometry-trig': {
    name: '3. Geometry and Trigonometry',
    subtopics: [
      '3D Geometry',
      'Triangle Trigonometry',
      'Trigonometry Applications',
      'Circular Measure',
      'Unit Circle & Ratios',
      'Trigonometric Identities',
      'Trigonometric Functions & Graphs',
      'Solving Trigonometric Equations',
      'Reciprocal & Inverse Trig Functions',
      'Compound & Double Angle Identities',
      'Trig Graph Symmetries',
      'Vector Concepts',
      'Scalar Product',
      'Vector Equation of a Line',
      'Line Relationships',
      'Vector Product',
      'Vector Equation of a Plane',
      'Line & Plane Intersections',
    ],
  },
  'statistics': {
    name: '4. Statistics and Probability',
    subtopics: [
      'Data & Sampling',
      'Data Presentation',
      'Descriptive Statistics',
      'Linear Correlation & Regression',
      'Basic Probability',
      'Probability Events',
      'Conditional & Independent Probability',
      'Discrete Random Variables',
      'Binomial Distribution',
      'Normal Distribution',
      'Z-Scores',
      "Bayes' Theorem",
      'Variance of Discrete Random Variables',
      'Continuous Random Variables',
    ],
  },
  'calculus': {
    name: '5. Calculus',
    subtopics: [
      'Intro to Differentiation',
      'Tangents & Normals',
      'Intro to Integration',
      'Standard Derivatives',
      'Chain Rule',
      'Product & Quotient Rules',
      'Second Derivative',
      'Optimization',
      'Kinematics',
      'Standard Integrals',
      'Definite Integrals & Areas',
      'Continuity & Limits',
      'First Principles & Higher Derivatives',
      "L'Hôpital's Rule",
      'Implicit Differentiation',
      'Related Rates',
      'Advanced Derivatives & Integrals',
      'Integration by Partial Fractions',
      'Integration by Substitution',
      'Integration by Parts',
      'Volumes of Revolution',
      'Differential Equations',
      'Maclaurin Series',
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

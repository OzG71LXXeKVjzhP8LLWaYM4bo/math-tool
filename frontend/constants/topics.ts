// IB HL Topics Taxonomy

export type Subject = 'math' | 'physics' | 'chemistry';

export interface TopicMap {
  [category: string]: string[];
}

export const IB_TOPICS: Record<Subject, TopicMap> = {
  math: {
    'Number & Algebra': ['Sequences', 'Logarithms', 'Complex Numbers', 'Proof'],
    'Functions': ['Transformations', 'Quadratics', 'Exponentials', 'Rational'],
    'Geometry & Trigonometry': ['Sine/Cosine Rule', 'Radians', 'Identities', 'Vectors'],
    'Statistics & Probability': ['Distributions', 'Binomial', 'Normal', 'Regression'],
    'Calculus': ['Differentiation', 'Integration', 'Differential Equations', 'Optimization'],
  },
  physics: {
    'Mechanics': ['Kinematics', 'Forces', 'Momentum', 'Energy'],
    'Thermal Physics': ['Temperature', 'Heat Transfer', 'Ideal Gases'],
    'Waves': ['Wave Properties', 'Sound', 'Light', 'Interference'],
    'Electricity': ['Circuits', 'Fields', 'Magnetism', 'Induction'],
    'Nuclear Physics': ['Radioactivity', 'Nuclear Reactions', 'Energy Levels'],
  },
  chemistry: {
    'Stoichiometry': ['Moles', 'Limiting Reagents', 'Gas Laws'],
    'Atomic Structure': ['Orbitals', 'Electron Configuration', 'Periodicity'],
    'Bonding': ['Ionic', 'Covalent', 'Metallic', 'Intermolecular'],
    'Energetics': ['Enthalpy', 'Hess Law', 'Bond Enthalpies'],
    'Kinetics': ['Rate Laws', 'Mechanisms', 'Activation Energy'],
    'Equilibrium': ['Kc', 'Kp', 'Le Chatelier', 'Acids/Bases'],
  },
};

export const SUBJECT_NAMES: Record<Subject, string> = {
  math: 'Mathematics',
  physics: 'Physics',
  chemistry: 'Chemistry',
};

export const SUBJECT_ICONS: Record<Subject, string> = {
  math: 'function',
  physics: 'atom',
  chemistry: 'flask',
};

export const DIFFICULTY_LABELS: Record<number, string> = {
  1: 'Easy',
  2: 'Medium-Easy',
  3: 'Medium',
  4: 'Medium-Hard',
  5: 'Hard',
};

export const DIFFICULTY_COLORS: Record<number, string> = {
  1: '#4CAF50', // Green
  2: '#8BC34A', // Light Green
  3: '#FFC107', // Yellow
  4: '#FF9800', // Orange
  5: '#F44336', // Red
};

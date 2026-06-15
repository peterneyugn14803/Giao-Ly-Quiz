export interface QuestionItem {
  id: string; // e.g. "001", "002"
  part?: string; // Optional part name
  chapter: string; // Chapter name
  lesson: string; // Lesson name
  question: string; // Question content
  answer: string; // Answer content
  referenceCode: string; // Reference inside []
}

export interface ReviewState {
  id: string;
  interval: number; // in days
  repetitions: number;
  easeFactor: number;
  nextReviewDate: string; // Date string
  lastAnswerState: 'hard' | 'good' | 'easy' | 'new';
}

export interface UserProgress {
  learned: string[]; // List of question IDs marked as "Đã thuộc"
  needsReview: string[]; // List of question IDs marked as "Chưa thuộc"
  reviewStates: Record<string, ReviewState>; // Spaced repetition card metadata
  streak: number; // Daily learning streak
  lastActive: string | null; // Last active date "YYYY-MM-DD"
  quizScores: {
    date: string;
    total: number;
    correct: number;
    percentage: number;
  }[];
}

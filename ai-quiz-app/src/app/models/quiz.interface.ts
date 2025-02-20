export interface QuizSetup {
  topics: string[];
  questionType: 'theoretical' | 'numerical' | 'both';
  questionLevel: 'easy' | 'medium' | 'hard';
}

export interface Question {
  question: string;
  options: string[];
  answer: number;
}

export interface QuizSetup {
  topics: string[];
  questionType: 'theoretical' | 'numerical' | 'both';
}

export interface Question {
  question: string;
  options: string[];
  answer: number;
}

// quiz.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { QuizSetup, Question } from './models/quiz.interface';
import * as JSON5 from 'json5';

interface QuizResult {
  score: number;
  totalQuestions: number;
  answers: {
    question: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
  }[];
}

@Injectable({
  providedIn: 'root',
})
export class QuizService {
  private readonly AIXPLAIN_API_KEY =
    'f807dfba47058175a86409dd9e3cffa348802f67dd35b4a7d0a3b3f6e9f44b9c';
  private readonly POST_URL =
    'https://models.aixplain.com/api/v1/execute/671b8feb6eb563607a679e51';
  private questions: Question[] = [];
  private currentScore: number = 0;
  private quizResult: QuizResult = {
    score: 0,
    totalQuestions: 0,
    answers: [],
  };
  private answers: {
    question: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
  }[] = [];

  constructor(private http: HttpClient) {}

  generateQuestions(setup: QuizSetup): Observable<Question[]> {
    // Convert the setup into a prompt for the AI
    const prompt = this.createPrompt(setup);

    // Return an Observable that wraps our async operation
    return from(this.fetchQuestions(prompt));
  }

  private createPrompt(setup: QuizSetup): string {
    const topics = setup.topics.join(', ');
    const questionType = setup.questionType;
    const questionLevel = setup.questionLevel;

    return `Generate multiple choice questions about ${topics}.
    Question type should be ${questionType} of level ${setup.questionLevel}for CUET Exam class 12th cbse.
    must format the response as a JSON array where each question object has the following structure:
    {
      "question": "the question text",
      "options": ["option A", "option B", "option C", "option D" ],
      "answer": number (0-3 representing the index of the correct option)
    }`;
  }

  private async fetchQuestions(
    prompt: string,
    maxRetries = 3
  ): Promise<Question[]> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Initial POST request
        const postResponse = await fetch(this.POST_URL, {
          method: 'POST',
          headers: {
            'x-api-key': this.AIXPLAIN_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: prompt,
          }),
        });

        const postResult = await postResponse.json();
        const requestId = postResult.requestId;
        const getUrl = `https://models.aixplain.com/api/v1/data/${requestId}`;

        // Polling for results
        const getResponse = await fetch(getUrl, {
          method: 'GET',
          headers: {
            'x-api-key': this.AIXPLAIN_API_KEY,
            'Content-Type': 'application/json',
          },
        });

        const result = await getResponse.json();

        console.log(result);

        if (result.completed) {
          try {
            const questions = this.parseAIResponse(result.data);
            if (questions.length > 0) {
              this.questions = questions;
              return questions;
            }
          } catch (error) {
            console.error(`Attempt ${attempt}: Invalid response format`);
            lastError = error as Error;
            if (attempt === maxRetries) throw error;
            continue;
          }
        }

        // Wait for 5 seconds before next poll
        await new Promise((resolve) => setTimeout(resolve, 5000));
      } catch (error) {
        lastError = error as Error;
        if (attempt === maxRetries) throw error;
        await new Promise((resolve) => setTimeout(resolve, 2000 * attempt)); // Exponential backoff
      }
    }

    throw (
      lastError ||
      new Error('Failed to generate valid questions after multiple attempts')
    );
  }

  private parseAIResponse(aiOutput: string): Question[] {
    try {
      // Extract JSON between ```json and ``` markers
      const jsonMatch = aiOutput.match(/```json\s*([\s\S]*?)\s*```/);
      let jsonStr = jsonMatch ? jsonMatch[1] : aiOutput;

      // Clean up any remaining text before/after the JSON array
      const arrayMatch = jsonStr.match(/\[\s*{[\s\S]*?}\s*\]/);
      if (!arrayMatch) {
        throw new Error('No valid JSON array found in response');
      }
      jsonStr = arrayMatch[0];

      // Parse and validate
      let parsedQuestions = JSON5.parse(jsonStr);
      if (!Array.isArray(parsedQuestions)) {
        throw new Error('Response is not an array');
      }

      // Validate and format each question
      return parsedQuestions
        .filter((q): q is NonNullable<typeof q> => q && typeof q === 'object')
        .map((q: any): Question | null => {
          // Ensure all required fields exist and are valid
          if (
            !q.question ||
            !Array.isArray(q.options) ||
            typeof q.answer !== 'number'
          ) {
            return null;
          }

          // Ensure we have exactly 4 options
          const options = q.options.map(String).filter(Boolean).slice(0, 4);
          if (options.length !== 4) {
            return null;
          }

          return {
            question: String(q.question).trim(),
            options: options,
            answer: Math.min(Math.max(0, q.answer), 3), // Ensure answer is between 0-3
          };
        })
        .filter((q): q is Question => q !== null); // Type predicate to filter out nulls
    } catch (error) {
      console.error('Error parsing AI response:', error);
      console.error('Original AI output:', aiOutput);
      throw new Error(
        'Failed to parse questions from AI response. Please try again.'
      );
    }
  }

  setQuestions(questions: Question[]) {
    this.questions = questions;
  }

  getQuestions(): Question[] {
    return this.questions;
  }

  setScore(score: number) {
    this.currentScore = score;
  }

  getScore(): number {
    return this.currentScore;
  }

  setQuizResult(
    score: number,
    answers: {
      question: string;
      userAnswer: string;
      correctAnswer: string;
      isCorrect: boolean;
    }[]
  ) {
    this.quizResult = {
      score,
      totalQuestions: this.questions.length,
      answers,
    };
  }

  getQuizResult(): QuizResult {
    return this.quizResult;
  }

  getAnswers() {
    return this.answers;
  }

  clearAnswers() {
    this.answers = [];
  }

  addAnswer(answer: {
    question: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
  }) {
    this.answers.push(answer);
  }
}

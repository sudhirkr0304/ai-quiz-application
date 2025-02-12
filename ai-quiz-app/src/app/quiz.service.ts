// quiz.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { QuizSetup, Question } from './models/quiz.interface';
import * as JSON5 from 'json5';

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

    return `Generate multiple choice questions about ${topics}.
    Question type should be ${questionType} for CUET Exam class 12th cbse.
    must format the response as a JSON array where each question object has the following structure:
    {
      "question": "the question text",
      "options": ["option A", "option B", "option C", "option D" ],
      "answer": number (0-3 representing the index of the correct option)
    }`;
  }

  private async fetchQuestions(prompt: string): Promise<Question[]> {
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
      while (true) {
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
          // Parse the AI response into our Question format
          try {
            const questions = this.parseAIResponse(result.data);
            console.log(questions);
            this.questions = questions;
            return questions;
          } catch (error) {
            console.error('Error parsing AI response:', error);
            throw new Error('Failed to parse questions from AI response');
          }
        }

        // Wait for 5 seconds before next poll
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    } catch (error) {
      console.error('Error generating questions:', error);
      throw new Error('Failed to generate questions');
    }
  }

  private parseAIResponse(aiOutput: string): Question[] {
    try {
      // Extract JSON using the correct regex pattern
      const jsonMatch = aiOutput.match(/```json\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : aiOutput; // Extract JSON part
      console.log(jsonStr);

      // Parse the JSON
      const parsedQuestions = JSON5.parse(jsonStr);

      console.log(parsedQuestions);

      // Validate and format each question
      return parsedQuestions.map((q: any) => {
        if (
          !q.question ||
          !Array.isArray(q.options) ||
          q.options.length < 2 || // Ensuring at least 2 options exist
          typeof q.answer !== 'number'
        ) {
          throw new Error('Invalid question format');
        }

        return {
          question: q.question,
          options: q.options,
          answer: q.answer,
        };
      });
    } catch (error) {
      console.error('Error parsing AI response:', error);
      throw new Error('Failed to parse AI response');
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
}

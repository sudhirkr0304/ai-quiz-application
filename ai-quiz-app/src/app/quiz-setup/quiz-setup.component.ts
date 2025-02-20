// quiz-setup.component.ts

import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { QuizService } from '../quiz.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-quiz-setup',
  templateUrl: './quiz-setup.component.html',
  styleUrls: ['./quiz-setup.component.css'],
})
export class QuizSetupComponent {
  topics: string[] = [''];
  selectedType: 'theoretical' | 'numerical' | 'both' = 'both';
  isLoading = false;
  selectedLevel: 'easy' | 'medium' | 'hard' = 'easy';

  constructor(
    private quizService: QuizService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  addTopic() {
    this.topics.push('');
  }

  removeTopic(index: number) {
    this.topics.splice(index, 1);
  }

  isValid(): boolean {
    return this.topics.some((topic) => topic.trim() !== '');
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  async startQuiz() {
    if (this.isLoading) return;

    this.isLoading = true;
    const setup = {
      topics: this.topics.filter((topic) => topic.trim() !== ''),
      questionType: this.selectedType,
      questionLevel: this.selectedLevel,
    };

    try {
      await this.quizService.generateQuestions(setup).toPromise();
      this.router.navigate(['/quiz']);
    } catch (error) {
      this.snackBar.open(
        'Failed to generate questions. Please try again.',
        'Close',
        { duration: 5000 }
      );
      console.error('Error generating questions:', error);
    } finally {
      this.isLoading = false;
    }
  }
}

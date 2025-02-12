import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { QuizService } from '../quiz.service';
import { Question } from '../models/quiz.interface';

@Component({
  selector: 'app-quiz',
  templateUrl: './quiz.component.html',
  styleUrls: ['./quiz.component.css'],
})
export class QuizComponent implements OnInit {
  questions: Question[] = [];
  currentQuestionIndex: number = 0;
  selectedOption: number | null = null;
  score: number = 0;

  constructor(private quizService: QuizService, private router: Router) {}

  ngOnInit() {
    this.questions = this.quizService.getQuestions();
    if (this.questions.length === 0) {
      this.router.navigate(['/']);
    }
  }

  get currentQuestion(): Question {
    return this.questions[this.currentQuestionIndex];
  }

  get isLastQuestion(): boolean {
    return this.currentQuestionIndex === this.questions.length - 1;
  }

  nextQuestion() {
    if (this.selectedOption === this.currentQuestion.answer) {
      this.score++;
    }

    if (this.isLastQuestion) {
      this.quizService.setScore(this.score);
      this.router.navigate(['/result']);
    } else {
      this.currentQuestionIndex++;
      this.selectedOption = null;
    }
  }
}

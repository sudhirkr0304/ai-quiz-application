import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { QuizService } from '../quiz.service';
import { Question } from '../models/quiz.interface';
import { interval, Subscription } from 'rxjs';
import { take } from 'rxjs/operators';

interface Timer {
  minutes: number;
  seconds: number;
}

@Component({
  selector: 'app-quiz',
  templateUrl: './quiz.component.html',
  styleUrls: ['./quiz.component.css'],
})
export class QuizComponent implements OnInit, OnDestroy {
  questions: Question[] = [];
  currentQuestionIndex: number = 0;
  selectedOption: number | null = null;
  score: number = 0;
  timer: Timer = { minutes: 10, seconds: 0 };
  timerSubscription: Subscription | null = null;

  constructor(private quizService: QuizService, private router: Router) {}

  ngOnInit() {
    this.questions = this.quizService.getQuestions();
    if (this.questions.length === 0) {
      this.router.navigate(['/']);
    }
    this.startTimer();
  }

  get currentQuestion(): Question {
    return this.questions[this.currentQuestionIndex];
  }

  get isLastQuestion(): boolean {
    return this.currentQuestionIndex === this.questions.length - 1;
  }

  nextQuestion() {
    const currentQ = this.currentQuestion;
    const isCorrect = this.selectedOption === currentQ.answer;

    if (isCorrect) {
      this.score++;
    }

    const answer = {
      question: currentQ.question,
      userAnswer: currentQ.options[this.selectedOption!],
      correctAnswer: currentQ.options[currentQ.answer],
      isCorrect,
    };

    if (this.isLastQuestion) {
      this.quizService.setQuizResult(this.score, [
        ...this.quizService.getAnswers(),
        answer,
      ]);
      this.router.navigate(['/result']);
    } else {
      this.quizService.addAnswer(answer);
      this.currentQuestionIndex++;
      this.selectedOption = null;
    }
  }

  startTimer() {
    this.timerSubscription = interval(1000).subscribe(() => {
      if (this.timer.seconds > 0) {
        this.timer.seconds--;
      } else if (this.timer.minutes > 0) {
        this.timer.minutes--;
        this.timer.seconds = 59;
      } else {
        this.timerSubscription?.unsubscribe();
        this.router.navigate(['/result']);
      }
    });
  }

  ngOnDestroy() {
    this.timerSubscription?.unsubscribe();
  }
}

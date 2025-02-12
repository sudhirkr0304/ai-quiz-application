import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { QuizService } from '../quiz.service';

@Component({
  selector: 'app-result',
  templateUrl: './result.component.html',
  styleUrls: ['./result.component.css'],
})
export class ResultComponent implements OnInit {
  score: number = 0;
  totalQuestions: number = 0;

  constructor(private quizService: QuizService, private router: Router) {}

  ngOnInit() {
    this.score = this.quizService.getScore();
    this.totalQuestions = this.quizService.getQuestions().length;
  }

  get percentage(): number {
    return Math.round((this.score / this.totalQuestions) * 100);
  }

  restartQuiz() {
    this.router.navigate(['/']);
  }
}

import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { QuizService } from '../quiz.service';

@Component({
  selector: 'app-result',
  templateUrl: './result.component.html',
  styleUrls: ['./result.component.css'],
})
export class ResultComponent implements OnInit {
  result = this.quizService.getQuizResult();
  percentage = (this.result.score / this.result.totalQuestions) * 100;

  constructor(private quizService: QuizService, private router: Router) {}

  ngOnInit() {
    if (this.result.totalQuestions === 0) {
      this.router.navigate(['/']);
    }
  }

  restartQuiz() {
    this.router.navigate(['/']);
  }
}

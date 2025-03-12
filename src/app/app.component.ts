import { Component } from '@angular/core';
import { TodoListComponent } from './todo-list/todo-list.component';
import { ImageScrollerComponent } from './image-scroller/image-scroller.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, TodoListComponent, ImageScrollerComponent],
  template: `
    <div class="app-container">
      <header>
        <h1>{{title}}</h1>
      </header>
      <app-image-scroller></app-image-scroller>
      <app-todo-list></app-todo-list>
    </div>
  `,
  styles: [`
    .app-container {
      max-width: 1000px;
      margin: 0 auto;
      padding: 20px;
    }
    
    header {
      text-align: center;
      margin-bottom: 2rem;
    }
    
    h1 {
      color: #333;
      font-size: 2rem;
    }
  `]
})
export class AppComponent {
  title = 'Task Manager';
}
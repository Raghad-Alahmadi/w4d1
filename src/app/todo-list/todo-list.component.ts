import { CommonModule } from '@angular/common'
import { Component, OnInit } from '@angular/core'
import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms'
import { Observable } from 'rxjs'
import { Task } from '../state/list.reducer'
import { Store } from '@ngrx/store'
import {
  selectAllTodos,
  selectCompletedTodos,
  selectIncompleteTodos,
} from '../state/list.selector'
import {
  addTask,
  completeTask,
  removeTask,
  resetTasks,
  loadTasks,
} from '../state/list.actions'
import { TodoApiService } from '../services/todo-api.service'

@Component({
  selector: 'app-todo-list',
  imports: [ReactiveFormsModule, CommonModule, FormsModule],
  templateUrl: './todo-list.component.html',
  styleUrl: './todo-list.component.scss',
})
export class TodoListComponent implements OnInit {
  todoForm?: FormGroup
  todos$?: Observable<Task[]>
  completedTodos$?: Observable<Task[]>
  incompleteTodos$?: Observable<Task[]>
  loading: boolean = false;

  constructor(
    private fb: FormBuilder, 
    private store: Store,
    private todoApiService: TodoApiService
  ) {
    this.todos$ = this.store.select(selectAllTodos)
    this.completedTodos$ = this.store.select(selectCompletedTodos)
    this.incompleteTodos$ = this.store.select(selectIncompleteTodos)
  }

  ngOnInit(): void {
    this.todoForm = this.fb.group({
      name: new FormControl('', [Validators.minLength(2), Validators.required]),
    })
    this.loadTodos();
  }

  loadTodos(): void {
    this.loading = true;
    this.todoApiService.getTodos().subscribe({
      next: (tasks) => {
        this.store.dispatch(loadTasks({ tasks }));
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading tasks:', err);
        this.loading = false;
      }
    });
  }
  
  onSubmit() {
    this.addTodo();
  }

  addTodo(): void {
    if (this.todoForm?.valid) {
      const newTask = {
        name: this.todoForm.value.name,
        complete: false,
      };
      
      // First add to store optimistically
      this.store.dispatch(addTask({ task: newTask }));
      
      // Then send to API
      this.todoApiService.addTodo(newTask).subscribe({
        error: (err) => {
          console.error('Error adding task:', err);
        }
      });
      
      this.todoForm.reset();
    }
  }
  
  completeTodo(id: string): void {
    this.store.dispatch(completeTask({ id }));
    
    // Get the task and update it on the server
    this.todos$?.subscribe(todos => {
      const task = todos.find(t => t.id === id);
      if (task) {
        const updatedTask = { ...task, complete: true };
        this.todoApiService.updateTodo(updatedTask).subscribe({
          error: (err) => console.error('Error completing task:', err)
        });
      }
    }).unsubscribe();
  }

  removeTodo(id: string): void {
    this.store.dispatch(removeTask({ id }));
    
    this.todoApiService.deleteTodo(id).subscribe({
      error: (err) => console.error('Error removing task:', err)
    });
  }

  resetAllTodos(): void {
    this.store.dispatch(resetTasks());
  }
}
import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ViewChild, ElementRef } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Observable, Subject, of, BehaviorSubject } from 'rxjs';
import { takeUntil, take, tap, finalize } from 'rxjs/operators';
import { Task } from '../state/list.reducer';
import { Store } from '@ngrx/store';
import {
  selectAllTodos,
  selectCompletedTodos,
  selectIncompleteTodos,
} from '../state/list.selector';
import {
  addTask,
  completeTask,
  removeTask,
  resetTasks,
  loadTasks,
} from '../state/list.actions';
import { TodoApiService } from '../services/todo-api.service';

@Component({
  selector: 'app-todo-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
  ],
  templateUrl: './todo-list.component.html',
  styleUrl: './todo-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TodoListComponent implements OnInit, OnDestroy {
  todoForm!: FormGroup;
  todos$: Observable<Task[]>;
  completedTodos$: Observable<Task[]>;
  incompleteTodos$: Observable<Task[]>;
  loading: boolean = false;
  error: string | null = null;
  private destroy$ = new Subject<void>();
  
  private static dataLoaded = false;
  
  @ViewChild('todoInput') todoInput?: ElementRef;
  
  filterTypes = FilterType;
  activeFilter: FilterType = FilterType.ALL;
  filteredTodos: Task[] | null = null;

  constructor(
    private fb: FormBuilder, 
    private store: Store<AppState>,
    private todoApiService: TodoApiService
  ) {
    this.todos$ = this.store.select(selectAllTodos);
    this.completedTodos$ = this.store.select(selectCompletedTodos);
    this.incompleteTodos$ = this.store.select(selectIncompleteTodos);
  }

  ngOnInit(): void {
    this.initForm();
    
    // Load data only once on app startup
    this.loadInitialData();
    
    // Set up filter subscription
    this.todos$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(todos => {
      this.updateFilteredTodos(todos);
    });
  }
  
  private initForm(): void {
    this.todoForm = this.fb.group({
      name: new FormControl('', [Validators.minLength(2), Validators.required]),
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setFilter(filter: FilterType): void {
    this.activeFilter = filter;
    this.todos$.pipe(take(1)).subscribe(todos => {
      this.updateFilteredTodos(todos);
    });
  }

  private updateFilteredTodos(todos: Task[]): void {
    switch (this.activeFilter) {
      case FilterType.ACTIVE:
        this.filteredTodos = todos.filter(todo => !todo.complete);
        break;
      case FilterType.COMPLETED:
        this.filteredTodos = todos.filter(todo => todo.complete);
        break;
      case FilterType.ALL:
      default:
        this.filteredTodos = todos;
        break;
    }
  }

  getPendingCount(todos: Task[]): number {
    return todos.filter(todo => !todo.complete).length;
  }

  getCompletedCount(todos: Task[]): number {
    return todos.filter(todo => todo.complete).length;
  }

  private loadInitialData(): void {
    if (TodoListComponent.dataLoaded) {
      console.log('Data already loaded, skipping API call');
      return;
    }
    
    this.loading = true;
    this.error = null;

    // First check if we already have data in the store
    this.todos$.pipe(take(1)).subscribe(todos => {
      if (todos.length > 0) {
        console.log('Data already in store, skipping API call');
        TodoListComponent.dataLoaded = true;
        this.loading = false;
        return;
      }
      
      console.log('Loading data from API...');
      
      this.todoApiService.getTodos(1, 200)
        .pipe(
          tap(() => {
            TodoListComponent.dataLoaded = true;
            console.log('Data loaded and marked as loaded');
          }),
          takeUntil(this.destroy$),
          finalize(() => this.loading = false)
        )
        .subscribe({
          next: (response: Task[] | PaginatedResponse) => {
            const tasks: Task[] = Array.isArray(response) 
              ? response 
              : (response.items || []);
            
            this.store.dispatch(resetTasks());
            
            this.store.dispatch(loadTasks({ tasks }));
          },
          error: (err) => {
            console.error('Error loading tasks:', err);
            this.error = 'Failed to load tasks. Please try again.';
          }
        });
    });
  }

  onSubmit(): void {
    if (this.todoForm.valid) {
      this.addTodo();
    }
  }

  addTodo(): void {
    const name = this.todoForm.value.name?.trim();
    if (!name) return;
    
    this.todoForm.reset();
    setTimeout(() => {
      this.todoInput?.nativeElement?.focus();
    });

    const uniqueId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Create the task object with our guaranteed unique ID
    const newTask: Task = { 
      id: uniqueId,
      name, 
      complete: false 
    };
    
    // Add to store 
    this.store.dispatch(addTask({ task: newTask }));
    
  }
  
  completeTodo(id: string): void {
    // Store original task state in case we need to rollback
    let originalTask: Task | undefined;
    
    this.todos$.pipe(take(1)).subscribe(todos => {
      originalTask = todos.find(t => t.id === id);
      if (!originalTask) return;
      
      this.store.dispatch(completeTask({ id }));
      
    });
  }

  removeTodo(id: string): void {
    this.store.dispatch(removeTask({ id }));
    
  }

  resetAllTodos(): void {
    this.store.dispatch(resetTasks());
  }
  
  // Track todo items by id for better performance
  trackByFn(index: number, item: Task): string {
    return item.id;
  }
}

enum FilterType {
  ALL = 'all',
  ACTIVE = 'active',
  COMPLETED = 'completed'
}

interface AppState {
  tasks: { entities: { [id: string]: Task }, ids: string[] };
}

interface PaginatedResponse {
  items?: Task[];
  total?: number;
  [key: string]: any;
}
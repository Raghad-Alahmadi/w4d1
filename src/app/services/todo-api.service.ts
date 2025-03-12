import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { Task } from '../state/list.reducer';

@Injectable({
  providedIn: 'root'
})
export class TodoApiService {
  private apiUrl = 'https://jsonplaceholder.typicode.com/todos';

  constructor(private http: HttpClient) { }

  // Basic implementation without optimizations
  getTodos(): Observable<Task[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      map(todos => todos.map(todo => ({
        id: todo.id.toString(),
        name: todo.title,
        complete: todo.completed
      }))),
      catchError(this.handleError<Task[]>('getTodos', []))
    );
  }

  addTodo(task: Omit<Task, 'id'>): Observable<Task> {
    return this.http.post<any>(this.apiUrl, {
      title: task.name,
      completed: task.complete,
      userId: 1
    }).pipe(
      map(response => ({
        id: response.id.toString(),
        name: response.title,
        complete: response.completed
      })),
      catchError(this.handleError<Task>('addTodo'))
    );
  }

  updateTodo(task: Task): Observable<Task> {
    return this.http.put<any>(`${this.apiUrl}/${task.id}`, {
      title: task.name,
      completed: task.complete,
      userId: 1
    }).pipe(
      map(response => ({
        id: response.id.toString(),
        name: response.title || '',
        complete: response.completed || false
      })),
      catchError(this.handleError<Task>('updateTodo'))
    );
  }

  deleteTodo(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError<void>('deleteTodo'))
    );
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed`);
      return of(result as T);
    };
  }
}
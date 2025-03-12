import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'todos', pathMatch: 'full' },
  { 
    path: 'todos', 
    loadComponent: () => import('./todo-list/todo-list.component')
      .then(m => m.TodoListComponent)
  },


  { path: '**', redirectTo: 'todos' }
];
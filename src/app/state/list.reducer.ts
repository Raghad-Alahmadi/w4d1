import { createReducer, on } from '@ngrx/store'
import { addTask, completeTask, resetTasks, removeTask, loadTasks } from './list.actions'

export type Task = {
  id: string
  complete: boolean
  name: string
}

export const initialState: Task[] = []

export const listReducer = createReducer(
  initialState,
  on(loadTasks, (state, { tasks }) => [...tasks]),
  
  on(addTask, (state, { task }) => [
    ...state,
    {
      id: Date.now().toString(),
      name: task.name,
      complete: task.complete,
    },
  ]),

  on(completeTask, (state, { id }) =>
    state.map(task => (task.id === id ? { ...task, complete: true } : task)),
  ),

  on(removeTask, (state, { id }) => state.filter(task => task.id !== id)),
  on(resetTasks, () => []),
)
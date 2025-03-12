import { createAction, props } from '@ngrx/store'
import { Task } from './list.reducer'

export const addTask = createAction(
  '[List] Add Task',
  props<{ task: Omit<Task, 'id'> }>(),
)
export const completeTask = createAction(
  '[List] Complete Task',
  props<{ id: string }>(),
)
export const removeTask = createAction(
  '[List] Remove Task',
  props<{ id: string }>(),
)
export const loadTasks = createAction(
  '[Task] Load Tasks',
  props<{ tasks: Task[] }>()
)
export const resetTasks = createAction('[List] Reset')

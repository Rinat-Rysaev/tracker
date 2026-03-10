export type TaskStatus = 'todo' | 'in-progress' | 'done' | 'blocked';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  streamId: string;
  quarterId: string;
  weekNumber: number; // 1–13
  orderInCell: number;
  orderInWeek: number;
  createdAt: number;
  updatedAt: number;
}

export interface WorkStream {
  id: string;
  name: string;
  color: string;
  order: number;
  quarterId: string;
}

export interface Quarter {
  id: string;
  label: string;
  year: number;
  quarter: 1 | 2 | 3 | 4;
  startDate: string; // ISO date, Monday of W1
}

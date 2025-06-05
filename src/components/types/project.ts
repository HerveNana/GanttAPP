// Types for Projects and Tasks
export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string | Date; // Allow both string and Date to handle serialization
  updatedAt: string | Date; // Allow both string and Date to handle serialization
  tasks: Task[];
}

export type TaskStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD';
export type TaskColor = 'default' | 'red' | 'green' | 'blue' | 'yellow' | 'purple';

export interface Task {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  startDate: string | Date; // Allow both string and Date to handle serialization
  endDate: string | Date; // Allow both string and Date to handle serialization
  status: TaskStatus;
  color?: TaskColor;
  completion?: number; // Add completion field
  dependencies: TaskDependency[];
}

export interface TaskDependency {
  taskId: string;
  type: 'FINISH_TO_START' | 'START_TO_START' | 'FINISH_TO_FINISH' | 'START_TO_FINISH';
}


import type { IBoardData } from "./boardData";

export interface ITaskData {
  id: string;
  boardId: string;
  columnId: string;
  description: string;
  title: string;
  status: string;
  totalSubtasks: number;
  completedSubtasks: number;
}

export interface ITaskDetails {
  id: string;
  boardId: string;
  columnId: string;
  title: string;
  description: string;
  status: string;
  subtasks: ISubtaskData[];
}

export interface ICreateTaskRequest {
  columnId: string;
  title: string;
  description: string;
  subtasks: {
    title: string;
    isCompleted?: boolean;
  }[];
}

export interface IUpdateTaskRequest {
  columnId: string;
  title: string;
  description: string;
  subtasks: {
    id: string;
    title: string;
    isCompleted: boolean;
  }[];
}

interface ISubtaskData {
  id: string;
  taskId: string;
  title: string;
  isCompleted: boolean;
}

export interface ITaskFilters {
  boardId?: string;
  columnId?: string;
  columnName?: string;
  q?: string;
}

export interface EditTaskValues {
  title: string;
  description?: string;
  columnId: string;

  subtasks: {
    id?: string;
    title: string;
  }[];
}

export interface TaskUpdateResult {
  board: IBoardData;
  task: ITaskData;
}

export interface ITaskTableRow {
  id: string;
  boardId: string;
  columnId: string;

  title: string;
  boardName: string;
  status: string;

  completedSubtasks: number;
  totalSubtasks: number;
}

export interface TaskListState {
  search: string;
  boardId?: string;
  status?: string;

  currentPage: number;
  pageSize: number;

  sortField?: "title" | "boardName" | "status";
  sortOrder?: "ascend" | "descend";
}

import type { IBoardData } from "./boardData";

export interface ITaskData {
  id: number;
  description: string;
  title: string;
  status: string;
  subtasks: ISubtaskData[];
}

interface ISubtaskData {
  id: number;
  title: string;
  isCompleted: boolean;
}

export interface ICreateTaskRequest {
  title: string;
  description: string;
  status: string;
  subtasks: {
    title: string;
    isCompleted: boolean;
  }[];
}

export interface IUpdateTaskRequest {
  title?: string;
  description?: string;
  status?: string;
  subtasks?: ISubtaskData[];
}

export interface EditTaskValues {
  title: string;
  description?: string;
  status: string;

  subtasks: {
    id?: number;
    title: string;
  }[];
}

export interface TaskUpdateResult {
  board: IBoardData;
  task: ITaskData;
}

export interface ITaskTableRow {
  task: ITaskData;
  id: number;
  boardId: string;
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

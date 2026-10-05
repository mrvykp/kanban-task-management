export interface ISubtaskData {
  id: string;
  taskId: string;
  title: string;
  isCompleted: boolean;
}

export interface ICreateSubtaskRequest {
  taskId: string;
  title: string;
  isCompleted?: boolean;
}

export interface IUpdateSubtaskRequest {
  taskId: string;
  title: string;
  isCompleted: boolean;
}

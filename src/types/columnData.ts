export interface IColumnData {
  id: string;
  boardId: string;
  name: string;
}

export interface IColumnDetails {
  id: string;
  boardId: string;
  name: string;
  taskCount: number;
}

export interface ICreateColumnRequest {
  boardId: string;
  name: string;
}

export interface IUpdateColumnRequest {
  boardId: string;
  name: string;
}

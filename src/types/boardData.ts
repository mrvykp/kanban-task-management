import type { ITaskData } from "./taskData";

export interface IBoardData {
  id: string;
  name: string;
}

export interface IBoardDetails {
  id: string;
  name: string;
  columns: IColumnData[];
}

interface IColumnData {
  id: string;
  boardId: string;
  name: string;
  taskCount: number;
}

export interface ICreateBoardRequest {
  name: string;
  columns?: ICreateBoardColumnRequest[];
}

export interface ICreateBoardColumnRequest {
  name: string;
}

export interface IUpdateBoardRequest {
  name: string;
}

export interface IListBoardsResponse {
  tasks: IBoardData[];
}

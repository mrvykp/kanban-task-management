import type { ITaskData } from "./taskData";

export interface IBoardData {
  id: string;
  name: string;
  columns: IColumnsData[];
}

interface IColumnsData {
  name: string;
  tasks: ITaskData[];
}

export interface ICreateBoardRequest {
  name: string;
  columns: IColumnsData[];
}

export type IUpdateBoardRequest = Partial<ICreateBoardRequest>;

export interface IListBoardsResponse {
  tasks: IBoardData[];
}

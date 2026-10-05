import type { IColumnDetails } from "./columnData";

export interface IBoardData {
  id: string;
  name: string;
}

export interface IBoardDetails {
  id: string;
  name: string;
  columns: IColumnDetails[];
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

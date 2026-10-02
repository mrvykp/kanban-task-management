import { api, api2 } from "../configuration/ApiConfig";
import type {
  IBoardData,
  IBoardDetails,
  ICreateBoardRequest,
  IUpdateBoardRequest,
} from "../types/boardData";

export const getAllBoards = async () => {
  const response = await api2.get<IBoardData[]>("boards");

  return response.data;
};

export const getBoardById = async (id: string) => {
  const response = await api2.get<IBoardData>(`boards/${id}`);
  return response.data;
};

export const createBoard = async (board: ICreateBoardRequest) => {
  const response = await api2.post<IBoardDetails>("boards", board);
  return response.data;
};

export const updateBoard = async (id: string, board: IUpdateBoardRequest) => {
  const response = await api2.put<IBoardDetails>(`boards/${id}`, board);
  return response.data;
};

export const deleteBoard = async (id: string) => {
  await api2.delete(`boards/${id}`);
};

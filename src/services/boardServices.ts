import { api, api2 } from "../configuration/ApiConfig";
import type {
  IBoardData,
  ICreateBoardRequest,
  IUpdateBoardRequest,
} from "../types/boardData";

export const getAllBoards = async () => {
  const response = await api.get<IBoardData[]>("boards");

  return response.data;
};

export const getAllBoardsNew = async () => {
  const response = await api2.get<
    {
      id: string;
      name: string;
    }[]
  >("boards");

  return response.data;
};

export const getBoardById = async (id: string) => {
  const response = await api.get<IBoardData>(`boards/${id}`);
  return response.data;
};

export const createBoard = async (board: ICreateBoardRequest) => {
  const response = await api.post<IBoardData>("boards", board);
  return response.data;
};

export const updateBoard = async (id: string, board: IUpdateBoardRequest) => {
  const response = await api.put<IBoardData>(`boards/${id}`, board);
  return response.data;
};

export const deleteBoard = async (id: string) => {
  await api.delete(`boards/${id}`);
};

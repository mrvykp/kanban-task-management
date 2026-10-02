import { api2 } from "../configuration/ApiConfig";
import type {
  IColumnData,
  IColumnDetails,
  ICreateColumnRequest,
  IUpdateColumnRequest,
} from "../types/columnData";

export const getColumnsByBoard = async (boardId: string) => {
  const response = await api2.get<IColumnData[]>("columns", {
    params: {
      boardId,
    },
  });

  return response.data;
};

export const getColumnById = async (id: string) => {
  const response = await api2.get<IColumnDetails>(`columns/${id}`);

  return response.data;
};

export const createColumn = async (column: ICreateColumnRequest) => {
  const response = await api2.post<IColumnDetails>("columns", column);
  return response.data;
};

export const updateColumn = async (
  id: string,
  column: IUpdateColumnRequest,
) => {
  const response = await api2.put<IColumnDetails>(`columns/${id}`, column);

  return response.data;
};

export const deleteColumn = async (id: string) => {
  await api2.delete(`columns/${id}`);
};

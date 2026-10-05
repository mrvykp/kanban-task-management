import { api2 } from "../configuration/ApiConfig";
import type {
  ICreateSubtaskRequest,
  ISubtaskData,
  IUpdateSubtaskRequest,
} from "../types/subtaskData";

export const getSubtasksByTask = async (taskId: string) => {
  const response = await api2.get<ISubtaskData[]>("subtasks", {
    params: { taskId },
  });
  return response.data;
};

export const getSubtaskById = async (id: string) => {
  const response = await api2.get<ISubtaskData>(`subtasks/${id}`);

  return response.data;
};

export const createSubtask = async (subtask: ICreateSubtaskRequest) => {
  const response = await api2.post<ISubtaskData>("subtasks", subtask);

  return response.data;
};

export const updateSubtask = async (
  id: string,
  request: IUpdateSubtaskRequest,
) => {
  const response = await api2.put<ISubtaskData>(`subtasks/${id}`, request);
  return response.data;
};

export const deleteSubtask = async (id: string) => {
  await api2.delete(`subtasks/${id}`);
};

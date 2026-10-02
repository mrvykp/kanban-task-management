import { api2 } from "../configuration/ApiConfig";
import type {
  ITaskDetails,
  ICreateTaskRequest,
  ITaskData,
  IUpdateTaskRequest,
  ITaskFilters,
} from "../types/taskData";

export const getTasks = async (filters: ITaskFilters = {}) => {
  const response = await api2.get<ITaskData[]>("tasks", {
    params: filters,
  });

  return response.data;
};

export const getTaskById = async (id: string) => {
  const response = await api2.get<ITaskDetails>(`tasks/${id}`);

  return response.data;
};

export const createTask = async (task: ICreateTaskRequest) => {
  const response = await api2.post<ITaskDetails>("tasks", task);

  return response.data;
};

export const updateTask = async (taskId: string, task: IUpdateTaskRequest) => {
  const response = await api2.put<ITaskDetails>(`tasks/${taskId}`, task);

  return response.data;
};

export const deleteTask = async (taskId: string) => {
  await api2.delete(`tasks/${taskId}`);
};

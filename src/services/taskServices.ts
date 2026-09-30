import type { IBoardData } from "../types/boardData";
import type {
  ICreateTaskRequest,
  ITaskData,
  IUpdateTaskRequest,
} from "../types/taskData";
import { getBoardById, updateBoard } from "./boardServices";

export const createTask = async (
  boardId: string,
  taskData: ICreateTaskRequest,
): Promise<ITaskData> => {
  const board = await getBoardById(boardId);

  const now = Date.now();

  const newTask: ITaskData = {
    id: now,
    title: taskData.title,
    description: taskData.description,
    status: taskData.status,
    subtasks: taskData.subtasks.map((subtask, index) => ({
      id: now + 1 + index,
      isCompleted: false,
      title: subtask.title,
    })),
  };

  const updatedBoard: IBoardData = {
    ...board,
    columns: board.columns.map((column) =>
      column.name === taskData.status
        ? {
            ...column,
            tasks: [...column.tasks, newTask],
          }
        : column,
    ),
  };

  await updateBoard(boardId, updatedBoard);

  return newTask;
};

export const updateTask = async (
  boardId: string,
  taskId: number,
  updates: IUpdateTaskRequest,
): Promise<ITaskData> => {
  const board = await getBoardById(boardId);

  let existingTask: ITaskData | undefined;
  let sourceColumnName: string | undefined;

  board.columns.forEach((column) => {
    const task = column.tasks.find((task) => task.id === taskId);

    if (task) {
      existingTask = task;
      sourceColumnName = column.name;
    }
  });
  if (!existingTask || !sourceColumnName) {
    throw new Error("Task not found");
  }

  const targetStatus = updates.status ?? existingTask.status;

  const updatedTask: ITaskData = {
    ...existingTask,
    ...updates,
    status: targetStatus,
  };

  let updatedColumns;

  if (sourceColumnName === targetStatus) {
    updatedColumns = board.columns.map((column) => {
      if (column.name !== sourceColumnName) {
        return column;
      }
      return {
        ...column,
        tasks: column.tasks.map((task) =>
          task.id === taskId ? updatedTask : task,
        ),
      };
    });
  } else {
    updatedColumns = board.columns.map((column) => {
      if (column.name === sourceColumnName) {
        return {
          ...column,
          tasks: column.tasks.filter((task) => task.id !== taskId),
        };
      }
      if (column.name === targetStatus) {
        return {
          ...column,
          tasks: [...column.tasks, updatedTask],
        };
      }
      return column;
    });
  }

  await updateBoard(boardId, {
    name: board.name,
    columns: updatedColumns,
  });
  return updatedTask;
};

export const deleteTask = async (
  boardId: string,
  taskId: number,
): Promise<void> => {
  const board = await getBoardById(boardId);

  const updatedBoard: IBoardData = {
    ...board,
    columns: board.columns.map((column) => ({
      ...column,
      tasks: column.tasks.filter((task) => task.id !== taskId),
    })),
  };
  await updateBoard(boardId, updatedBoard);
};

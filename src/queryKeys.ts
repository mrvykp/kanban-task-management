export const queryKeys = {
  boards: ["boards"] as const,

  board: (boardId: string) => ["board", boardId] as const,

  columns: (boardId: string) => ["columns", "board", boardId] as const,

  column: (columnId: string) => ["column", columnId] as const,

  allTasks: ["tasks", "all"] as const,

  tasksByBoard: (boardId: string) => ["tasks", "board", boardId] as const,

  tasksByColumn: (columnId: string) => ["tasks", "column", columnId] as const,

  task: (taskId: string) => ["task", taskId] as const,

  subtasks: (taskId: string) => ["subtasks", "task", taskId] as const,
};

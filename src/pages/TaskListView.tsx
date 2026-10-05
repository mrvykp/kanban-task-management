import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../queryKeys";
import { getAllBoards } from "../services/boardServices";
import { useMemo, useState } from "react";
import {
  Button,
  Input,
  Layout,
  Modal,
  Space,
  Table,
  Tooltip,
  type TableColumnsType,
} from "antd";
import type {
  EditTaskValues,
  ITaskTableRow,
  IUpdateTaskRequest,
  TaskListState,
} from "../types/taskData";
import TaskDetailsModal from "../components/TaskDetailsModal";
import TaskEditModal from "../components/TaskEditModal";
import { useNotify } from "../hooks/useNotify";
import {
  deleteTask,
  getTaskById,
  getTasks,
  updateTask,
} from "../services/taskServices";
import { DeleteOutlined, EditOutlined, EyeOutlined } from "@ant-design/icons";
import { useSearchParams } from "react-router-dom";
import HeaderContainer from "../components/HeaderContainer";
import { getColumnsByBoard } from "../services/columnServices";
import {
  createSubtask,
  deleteSubtask,
  updateSubtask,
} from "../services/subtaskServices";
import type { IUpdateSubtaskRequest } from "../types/subtaskData";

interface SelectedTask {
  boardId: string;
  taskId: string;
}

interface EditTaskMutationVariables {
  taskId: string;
  boardId: string;
  values: EditTaskValues;
}

const TaskListView = () => {
  const [selectedTask, setSelectedTask] = useState<SelectedTask | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [searchParams] = useSearchParams();

  const boardId = searchParams.get("boardId");

  const [taskListState, setTaskListState] = useState<TaskListState>({
    search: "",
    boardId: undefined,
    status: undefined,
    currentPage: 1,
    pageSize: 10,
    sortField: undefined,
    sortOrder: undefined,
  });
  const queryClient = useQueryClient();
  const notify = useNotify();

  //GET BOARDS
  const { data: boards = [] } = useQuery({
    queryKey: queryKeys.boards,
    queryFn: getAllBoards,
  });

  //GET TASKS
  const { data: tasks = [] } = useQuery({
    queryKey: queryKeys.allTasks,
    queryFn: () => getTasks(),
  });

  const { data: selectedTaskDetails, isPending: selectedTaskLoading } =
    useQuery({
      queryKey: queryKeys.task(selectedTask?.taskId ?? ""),

      queryFn: () => getTaskById(selectedTask!.taskId),

      enabled: !!selectedTask && (isDetailsModalOpen || isEditModalOpen),
    });

  const { data: selectedBoardColumns = [] } = useQuery({
    queryKey: queryKeys.columns(selectedTask?.boardId ?? ""),

    queryFn: () => getColumnsByBoard(selectedTask!.boardId),

    enabled: !!selectedTask && (isDetailsModalOpen || isEditModalOpen),
  });

  const currentBoard = boards.find((board) => board.id === boardId);

  const boardOptions = boards.map((board) => ({
    label: board.name,
    value: board.id,
  }));

  const statusOptions = useMemo(() => {
    const uniqueStatuses = [...new Set(tasks.map((task) => task.status))];

    return uniqueStatuses.map((status) => ({
      label: status,
      value: status,
    }));
  }, [tasks]);

  const boardNameMap = useMemo(
    () => new Map(boards.map((board) => [board.id, board.name])),
    [boards],
  );

  const tableData = useMemo<ITaskTableRow[]>(
    () =>
      tasks.map((task) => ({
        id: task.id,
        boardId: task.boardId,
        columnId: task.columnId,

        title: task.title,

        boardName: boardNameMap.get(task.boardId) ?? "Unknown board",

        status: task.status,
        completedSubtasks: task.completedSubtasks,
        totalSubtasks: task.totalSubtasks,
      })),
    [tasks, boardNameMap],
  );

  const filteredData = useMemo(() => {
    return tableData.filter((task) => {
      const matchesSearch = task.title
        .toLowerCase()
        .includes(taskListState.search.trim().toLowerCase());

      const matchedBoard =
        !taskListState.boardId || task.boardId === taskListState.boardId;

      const matchesStatus =
        !taskListState.status || task.status === taskListState.status;

      return matchesSearch && matchedBoard && matchesStatus;
    });
  }, [
    tableData,
    taskListState.search,
    taskListState.boardId,
    taskListState.status,
  ]);

  const updateTaskMutation = useMutation({
    mutationFn: ({
      taskId,
      updates,
    }: {
      taskId: string;
      boardId: string;
      updates: IUpdateTaskRequest;
    }) => updateTask(taskId, updates),

    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.allTasks,
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.tasksByBoard(variables.boardId),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.task(variables.taskId),
        }),
      ]);

      notify.success("Task updated", "Changes saved successfully.");
    },
    onError: () => {
      notify.error("Update failed", "Please try again.");
    },
  });

  const updateSubtaskMutation = useMutation({
    mutationFn: ({
      subtaskId,
      request,
    }: {
      subtaskId: string;
      request: IUpdateSubtaskRequest;
    }) => updateSubtask(subtaskId, request),

    onSuccess: async () => {
      if (!selectedTask) return;

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.allTasks,
        }),

        queryClient.invalidateQueries({
          queryKey: queryKeys.tasksByBoard(selectedTask.boardId),
        }),

        queryClient.invalidateQueries({
          queryKey: queryKeys.task(selectedTask.taskId),
        }),
      ]);
    },

    onError: (error) => {
      console.error("Failed to update subtask:", error);

      notify.error("Subtask update failed", "Please try again.");
    },
  });

  ////BURDA KALDIM
  const columns: TableColumnsType<ITaskTableRow> = [
    {
      title: "Task Title",
      dataIndex: "title",

      sorter: (a, b) => a.title.localeCompare(b.title),
    },
    {
      title: "Board",
      dataIndex: "boardName",
      key: "boardName",

      sorter: (a, b) => a.boardName.localeCompare(b.boardName),

      filters: boardOptions.map((board) => ({
        text: board.label,
        value: board.value,
      })),

      filteredValue: taskListState.boardId ? [taskListState.boardId] : null,
      filterMultiple: false,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",

      sorter: (a, b) => a.status.localeCompare(b.status),
      filters: statusOptions.map((status) => ({
        text: status.label,
        value: status.value,
      })),

      filteredValue: taskListState.status ? [taskListState.status] : null,
      filterMultiple: false,
    },
    {
      title: "Completed Subtasks",
      dataIndex: "completedSubtasks",
    },
    {
      title: "Total Subtasks",
      dataIndex: "totalSubtasks",
    },
    {
      title: "Actions",

      render: (_, record) => (
        <Space>
          <Tooltip title="View">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => {
                setSelectedTask({ boardId: record.boardId, taskId: record.id });
                setIsDetailsModalOpen(true);
              }}
            />
          </Tooltip>

          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => {
                setSelectedTask({ boardId: record.boardId, taskId: record.id });
                setIsEditModalOpen(true);
              }}
            />
          </Tooltip>

          <Tooltip title="Delete">
            <Button
              type="text"
              icon={<DeleteOutlined />}
              onClick={() => {
                handleDeleteFromTable(record);
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const selectedBoard = selectedTask
    ? boards.find((board) => board.id === selectedTask.boardId)
    : undefined;

  const handleDeleteFromTable = (record: ITaskTableRow) => {
    Modal.confirm({
      title: "Delete this task?",
      content: `Are you sure you want to delete "${record.title}"`,
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",

      onOk: () =>
        deleteTaskMutation.mutateAsync({
          boardId: record.boardId,
          taskId: record.id,
        }),
    });
  };

  const handleStatusChange = (newColumnId: string) => {
    if (!selectedTask || !selectedTaskDetails) {
      return;
    }

    const request: IUpdateTaskRequest = {
      columnId: newColumnId,
      title: selectedTaskDetails.title,
      description: selectedTaskDetails.description,
      subtasks: selectedTaskDetails.subtasks.map((subtask) => ({
        id: subtask.id,
        title: subtask.title,
        isCompleted: subtask.isCompleted,
      })),
    };

    updateTaskMutation.mutate({
      taskId: selectedTask.taskId,
      boardId: selectedTask.boardId,
      request,
    });
  };

  const handleSubtaskChange = (checkedValues: (string | number)[]) => {
    if (!selectedTask || !currentTask) return;

    const updatedSubtasks = currentTask.subtasks.map((subtask) => ({
      ...subtask,

      isCompleted: checkedValues.includes(subtask.id),
    }));

    updateTaskMutation.mutate({
      boardId: selectedTask.boardId,
      taskId: currentTask.id,
      updates: {
        subtasks: updatedSubtasks,
      },
    });
  };

  const deleteTaskMutation = useMutation({
    mutationFn: ({ taskId }: { taskId: string; boardId: string }) =>
      deleteTask(taskId),

    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.allTasks,
        }),

        queryClient.invalidateQueries({
          queryKey: queryKeys.tasksByBoard(variables.boardId),
        }),
      ]);

      queryClient.removeQueries({
        queryKey: queryKeys.task(variables.taskId),
      });

      setIsDetailsModalOpen(false);
      setSelectedTask(null);

      notify.success("Task deleted", "Task was deleted successfully.");
    },
  });

  const editTaskMutation = useMutation({
    mutationFn: async (values: EditTaskValues) => {
      if (!selectedTaskDetails) {
        throw new Error("Task details are not loaded");
      }

      const submittedSubtasks = values.subtasks ?? [];

      const submittedIds = new Set(
        submittedSubtasks
          .filter((subtask) => subtask.id)
          .map((subtask) => subtask.id as string),
      );

      const subtasksToDelete = selectedTaskDetails.subtasks.filter(
        (subtask) => !submittedIds.has(subtask.id),
      );

      const subtasksToCreate = submittedSubtasks.filter(
        (subtask) => !subtask.id,
      );

      const subtasksToUpdate = submittedSubtasks.filter((subtask) => {
        if (!subtask.id) return false;

        const existing = selectedTaskDetails.subtasks.find(
          (item) => item.id === subtask.id,
        );

        return existing && existing.title !== subtask.title.trim();
      });

      const taskRequest: IUpdateTaskRequest = {
        columnId: values.columnId,
        title: values.title.trim(),
        description: values.description ?? "",

        subtasks: selectedTaskDetails.subtasks.map((subtask) => ({
          id: subtask.id,
          title: subtask.title,
          isCompleted: subtask.isCompleted,
        })),
      };
      await updateTask(task.id, taskRequest);

      await Promise.all([
        ...subtasksToDelete.map((subtask) => deleteSubtask(subtask.id)),

        ...subtasksToCreate.map((subtask) =>
          createSubtask({
            taskId: task.id,
            title: subtask.title.trim(),
            isCompleted: false,
          }),
        ),

        ...subtasksToUpdate.map((subtask) => {
          const existing = selectedTaskDetails.subtasks.find(
            (item) => item.id === subtask.id,
          )!;

          return updateSubtask(subtask.id!, {
            taskId: task.id,
            title: subtask.title.trim(),
            isCompleted: existing.isCompleted,
          });
        }),
      ]);
    },

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.tasksByBoard(task.boardId),
        }),

        queryClient.invalidateQueries({
          queryKey: queryKeys.task(task.id),
        }),

        queryClient.invalidateQueries({
          queryKey: queryKeys.subtasks(task.id),
        }),
      ]);

      setIsEditModalOpen(false);

      notify.success("Task updated", "Changes saved successfully.");
    },

    onError: (error) => {
      console.error("Failed to edit task:", error);

      notify.error("Task update failed", "Please try again.");
    },
  });

  const handleEditTask = (values: EditTaskValues) => {
    if (!selectedTask || !currentTask) return;

    const now = Date.now();

    const updatedSubtasks = values.subtasks.map((subtask, index) => {
      const existingSubtask = currentTask.subtasks.find(
        (item) => item.id === subtask.id,
      );

      return {
        id: subtask.id ?? now + index,
        title: subtask.title,
        isCompleted: existingSubtask?.isCompleted ?? false,
      };
    });

    const updates: IUpdateTaskRequest = {
      title: values.title,
      description: values.description ?? "",
      status: values.status,
      subtasks: updatedSubtasks,
    };

    updateTaskMutation.mutate(
      {
        boardId: selectedTask.boardId,
        taskId: currentTask.id,
        updates,
      },

      {
        onSuccess: () => {
          setIsEditModalOpen(false);
        },
      },
    );
  };
  return (
    <Layout>
      {currentBoard && <HeaderContainer board={currentBoard} view="tasks" />}

      <div>
        <div
          style={{
            display: "flex",
            gap: "12px",
            marginBottom: "20px",
            padding: "20px",
          }}
        >
          <Input
            placeholder="Search tasks..."
            value={taskListState.search}
            onChange={(e) =>
              setTaskListState((prev) => ({
                ...prev,
                search: e.target.value,
                currentPage: 1,
              }))
            }
          />
        </div>
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey={(record) => `${record.boardId}-${record.id}`}
          pagination={{
            current: taskListState.currentPage,
            pageSize: taskListState.pageSize,
            pageSizeOptions: ["10", "20", "30", "50"],
            showSizeChanger: true,
            total: filteredData.length,
          }}
          onChange={(pagination, filters, sorter, extra) => {
            if (Array.isArray(sorter)) {
              return;
            }

            const selectedBoard = filters.boardName?.[0] as string | undefined;

            const selectedStatus = filters.status?.[0] as string | undefined;

            setTaskListState((prev) => ({
              ...prev,

              boardId: selectedBoard,
              status: selectedStatus,

              currentPage:
                extra.action === "filter" ? 1 : (pagination.current ?? 1),
              pageSize: pagination.pageSize ?? 10,

              sortField: sorter.order
                ? (sorter.field as "title" | "boardName" | "status")
                : undefined,

              sortOrder: sorter.order ?? undefined,
            }));
          }}
        />

        {selectedTaskDetails && isDetailsModalOpen && (
          <TaskDetailsModal
            open={isDetailsModalOpen}
            task={selectedTaskDetails}
            columns={selectedBoardColumns}
            onClose={() => setIsDetailsModalOpen(false)}
            onStatusChange={handleStatusChange}
            onSubtaskChange={handleSubtaskChange}
            showActions={false}
          />
        )}
        {selectedTaskDetails && isDetailsModalOpen && (
          <TaskEditModal
            open={isEditModalOpen}
            task={selectedTaskDetails}
            columns={selectedBoardColumns}
            loading={updateTaskMutation.isPending}
            onCancel={() => setIsEditModalOpen(false)}
            onSubmit={handleEditTask}
          />
        )}
      </div>
    </Layout>
  );
};

export default TaskListView;

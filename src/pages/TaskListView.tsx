import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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

import { DeleteOutlined, EditOutlined, EyeOutlined } from "@ant-design/icons";

import { useSearchParams } from "react-router-dom";

import { queryKeys } from "../queryKeys";

import { getAllBoards } from "../services/boardServices";

import {
  deleteTask,
  getTaskById,
  getTasks,
  updateTask,
} from "../services/taskServices";

import {
  createSubtask,
  deleteSubtask,
  updateSubtask,
} from "../services/subtaskServices";

import { getColumnsByBoard } from "../services/columnServices";

import type {
  EditTaskValues,
  ITaskTableRow,
  IUpdateTaskRequest,
  TaskListState,
} from "../types/taskData";

import type { IUpdateSubtaskRequest } from "../types/subtaskData";

import TaskDetailsModal from "../components/TaskDetailsModal";
import TaskEditModal from "../components/TaskEditModal";
import HeaderContainer from "../components/HeaderContainer";

import { useNotify } from "../hooks/useNotify";

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

  const { data: boards = [] } = useQuery({
    queryKey: queryKeys.boards,
    queryFn: getAllBoards,
  });

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

  // Used by HeaderContainer
  const currentBoard = boards.find((board) => board.id === boardId);

  // ----------------------------
  // Table options
  // ----------------------------

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

      const matchesBoard =
        !taskListState.boardId || task.boardId === taskListState.boardId;

      const matchesStatus =
        !taskListState.status || task.status === taskListState.status;

      return matchesSearch && matchesBoard && matchesStatus;
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
      request,
    }: {
      taskId: string;
      boardId: string;
      request: IUpdateTaskRequest;
    }) => updateTask(taskId, request),

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

    onError: (error) => {
      console.error("Failed to update task:", error);

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
      setIsEditModalOpen(false);
      setSelectedTask(null);

      notify.success("Task deleted", "Task was deleted successfully.");
    },

    onError: (error) => {
      console.error("Failed to delete task:", error);

      notify.error("Delete failed", "Task could not be deleted.");
    },
  });

  const editTaskMutation = useMutation({
    mutationFn: async ({ taskId, values }: EditTaskMutationVariables) => {
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
        if (!subtask.id) {
          return false;
        }

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

      await updateTask(taskId, taskRequest);

      await Promise.all([
        ...subtasksToDelete.map((subtask) => deleteSubtask(subtask.id)),

        ...subtasksToCreate.map((subtask) =>
          createSubtask({
            taskId,
            title: subtask.title.trim(),
            isCompleted: false,
          }),
        ),

        ...subtasksToUpdate.map((subtask) => {
          const existing = selectedTaskDetails.subtasks.find(
            (item) => item.id === subtask.id,
          )!;

          return updateSubtask(subtask.id!, {
            taskId,

            title: subtask.title.trim(),

            isCompleted: existing.isCompleted,
          });
        }),
      ]);
    },

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

      setIsEditModalOpen(false);

      notify.success("Task updated", "Changes saved successfully.");
    },

    onError: (error) => {
      console.error("Failed to edit task:", error);

      notify.error("Task update failed", "Please try again.");
    },
  });

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

  const handleSubtaskChange = (checkedValues: string[]) => {
    if (!selectedTask || !selectedTaskDetails) {
      return;
    }

    const changedSubtasks = selectedTaskDetails.subtasks.filter(
      (subtask) => checkedValues.includes(subtask.id) !== subtask.isCompleted,
    );

    changedSubtasks.forEach((subtask) => {
      updateSubtaskMutation.mutate({
        subtaskId: subtask.id,

        request: {
          taskId: selectedTask.taskId,

          title: subtask.title,

          isCompleted: checkedValues.includes(subtask.id),
        },
      });
    });
  };

  const handleEditTask = (values: EditTaskValues) => {
    if (!selectedTask) return;

    editTaskMutation.mutate({
      taskId: selectedTask.taskId,
      boardId: selectedTask.boardId,
      values,
    });
  };

  const handleDeleteFromTable = (record: ITaskTableRow) => {
    Modal.confirm({
      title: "Delete this task?",

      content: `Are you sure you want to delete "${record.title}"?`,

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

  const columns: TableColumnsType<ITaskTableRow> = [
    {
      title: "Task Title",
      dataIndex: "title",
      key: "title",

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
                setSelectedTask({
                  boardId: record.boardId,

                  taskId: record.id,
                });

                setIsDetailsModalOpen(true);
              }}
            />
          </Tooltip>

          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => {
                setSelectedTask({
                  boardId: record.boardId,

                  taskId: record.id,
                });

                setIsEditModalOpen(true);
              }}
            />
          </Tooltip>

          <Tooltip title="Delete">
            <Button
              type="text"
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteFromTable(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

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
          rowKey="id"
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

        {selectedTaskLoading &&
          selectedTask &&
          (isDetailsModalOpen || isEditModalOpen) && (
            <Modal
              open
              footer={null}
              onCancel={() => {
                setIsDetailsModalOpen(false);

                setIsEditModalOpen(false);
              }}
            >
              Loading task...
            </Modal>
          )}

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

        {selectedTaskDetails && isEditModalOpen && (
          <TaskEditModal
            open={isEditModalOpen}
            task={selectedTaskDetails}
            columns={selectedBoardColumns}
            loading={editTaskMutation.isPending}
            onCancel={() => setIsEditModalOpen(false)}
            onSubmit={handleEditTask}
          />
        )}
      </div>
    </Layout>
  );
};

export default TaskListView;

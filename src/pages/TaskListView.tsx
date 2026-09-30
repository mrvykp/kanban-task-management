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
import { deleteTask, updateTask } from "../services/taskServices";
import { DeleteOutlined, EditOutlined, EyeOutlined } from "@ant-design/icons";
import { useSearchParams } from "react-router-dom";
import HeaderContainer from "../components/HeaderContainer";

interface SelectedTask {
  boardId: string;
  taskId: number;
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

  const boardOptions = boards.map((board) => ({
    label: board.name,
    value: board.id,
  }));

  const statusOptions = useMemo(() => {
    const statuses = boards.flatMap((board) =>
      board.columns.map((column) => column.name),
    );

    const uniqueStatuses = [...new Set(statuses)];

    return uniqueStatuses.map((status) => ({
      label: status,
      value: status,
    }));
  }, [boards]);

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

  const tableData = useMemo(
    () =>
      boards.flatMap((board) =>
        board.columns.flatMap((column) =>
          column.tasks.map((task) => ({
            id: task.id,
            boardId: board.id,
            title: task.title,
            boardName: board.name,
            status: column.name,

            completedSubtasks: task.subtasks.filter(
              (subtask) => subtask.isCompleted,
            ).length,

            totalSubtasks: task.subtasks.length,

            task: task,
          })),
        ),
      ),
    [boards],
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

  const selectedBoard = selectedTask
    ? boards.find((board) => board.id === selectedTask.boardId)
    : undefined;

  const currentBoard = boards.find((board) => board.id === boardId);

  const currentTask = selectedBoard
    ? selectedBoard.columns
        .flatMap((column) => column.tasks)
        .find((task) => task.id === selectedTask?.taskId)
    : undefined;

  const selectedBoardColumns =
    selectedBoard?.columns.map((column) => column.name) ?? [];

  const updateTaskMutation = useMutation({
    mutationFn: ({
      boardId,
      taskId,
      updates,
    }: {
      boardId: string;
      taskId: number;
      updates: IUpdateTaskRequest;
    }) => updateTask(boardId, taskId, updates),

    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.boards,
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.board(variables.boardId),
        }),
      ]);

      notify.success("Task updated", "Changes saved successfully.");
    },
    onError: () => {
      notify.error("Update failed", "Please try again.");
    },
  });

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

  const handleStatusChange = (status: string) => {
    if (!selectedTask || !currentTask) return;

    updateTaskMutation.mutate({
      boardId: selectedTask.boardId,
      taskId: currentTask.id,
      updates: { status },
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
    mutationFn: ({ boardId, taskId }: { boardId: string; taskId: number }) =>
      deleteTask(boardId, taskId),

    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.boards,
        }),

        queryClient.invalidateQueries({
          queryKey: queryKeys.board(variables.boardId),
        }),
      ]);

      setIsDetailsModalOpen(false);
      setSelectedTask(null);

      notify.success("Task deleted", "Task was deleted successfully.");
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

        {currentTask && (
          <TaskDetailsModal
            open={isDetailsModalOpen}
            task={currentTask}
            columns={selectedBoardColumns}
            onClose={() => setIsDetailsModalOpen(false)}
            onStatusChange={handleStatusChange}
            onSubtaskChange={handleSubtaskChange}
            showActions={false}
          />
        )}
        {currentTask && (
          <TaskEditModal
            open={isEditModalOpen}
            task={currentTask}
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

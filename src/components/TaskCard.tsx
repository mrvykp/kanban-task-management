import { memo, useState } from "react";
import type {
  EditTaskValues,
  ITaskData,
  IUpdateTaskRequest,
} from "../types/taskData";

import { deleteTask, updateTask } from "../services/taskServices";

import { useNotify } from "../hooks/useNotify";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../queryKeys";
import TaskEditModal from "./TaskEditModal";
import TaskDetailsModal from "./TaskDetailsModal";
import { Modal } from "antd";

interface ITaskCardProps {
  data: ITaskData;
  boardId: string;
  columns: string[];
}

const TaskCard: React.FC<ITaskCardProps> = ({ data, boardId, columns }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const notify = useNotify();

  const queryClient = useQueryClient();

  const updateTaskMutation = useMutation({
    mutationFn: ({
      taskId,
      updates,
    }: {
      taskId: number;
      updates: IUpdateTaskRequest;
    }) => updateTask(boardId, taskId, updates),

    onSuccess: async (updatedTask) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.board(boardId),
        }),
      ]);

      notify.success(
        `"${updatedTask.title}" updated`,
        "Changes saved successfully.",
      );
    },

    onError: (error) => {
      console.error("Failed to update task:", error);
      notify.error("Failed to update Task", "Please try again.");
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (taskId: number) => deleteTask(boardId, taskId),

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.board(boardId),
        }),

        queryClient.invalidateQueries({ queryKey: queryKeys.boards }),
      ]);

      setIsModalOpen(false);

      notify.success(
        "Task deleted",
        `"${data.title}" was deleted successfully.`,
      );
    },

    onError: (error) => {
      console.error("Failed to delete task:", error);

      notify.error("Delete failed", "The task could not be deleted.");
    },
  });

  const numberOfSubtasks = data.subtasks.length;

  const checkedCount = data.subtasks.filter(
    (subtask) => subtask.isCompleted,
  ).length;

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleStatusChange = (value: string) => {
    updateTaskMutation.mutate({
      taskId: data.id,
      updates: {
        status: value,
      },
    });
  };

  const handleSubtaskChange = (checkedValues: (string | number)[]) => {
    const updatedSubtasks = data.subtasks.map((subtask) => ({
      ...subtask,

      isCompleted: checkedValues.includes(subtask.id),
    }));

    updateTaskMutation.mutate({
      taskId: data.id,
      updates: {
        subtasks: updatedSubtasks,
      },
    });
  };

  const handleDeleteTask = () => {
    Modal.confirm({
      title: "Delete this task?",
      content: `Are you sure you want to delete "${data.title}"`,
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",

      onOk: () => deleteTaskMutation.mutateAsync(data.id),
    });
  };

  const showEditModal = () => {
    setIsModalOpen(false);
    setIsEditModalOpen(true);
  };

  const handleEditTask = (values: EditTaskValues) => {
    const now = Date.now();

    const updatedSubtasks = values.subtasks.map((subtask, index) => {
      const existingSubtask = data.subtasks.find(
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
        taskId: data.id,
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
    <>
      <div
        style={{
          background: "#2b2c37",
          padding: "18px 16px",
          borderRadius: "8px",
          width: "100%",
          boxSizing: "border-box",
          marginTop: "10px",
          cursor: "pointer",
        }}
        onClick={showModal}
      >
        <p
          style={{
            color: "white",
            fontWeight: 600,
            fontSize: "15px",
            marginBottom: "8px",
          }}
        >
          {data.title}
        </p>

        <p
          style={{
            color: "#828fa3",
            fontSize: "12px",
            fontWeight: 600,
          }}
        >
          {checkedCount} of {numberOfSubtasks}
        </p>
      </div>
      {isModalOpen && (
        <TaskDetailsModal
          open={isModalOpen}
          task={data}
          columns={columns}
          onClose={() => setIsModalOpen(false)}
          onEdit={showEditModal}
          onDelete={handleDeleteTask}
          onStatusChange={handleStatusChange}
          onSubtaskChange={handleSubtaskChange}
        />
      )}
      <TaskEditModal
        open={isEditModalOpen}
        task={data}
        columns={columns}
        loading={updateTaskMutation.isPending}
        onCancel={() => setIsEditModalOpen(false)}
        onSubmit={handleEditTask}
      />
    </>
  );
};

export default memo(TaskCard);

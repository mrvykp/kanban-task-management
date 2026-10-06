import { memo, useState } from "react";
import type {
  EditTaskValues,
  ITaskData,
  IUpdateTaskRequest,
} from "../types/taskData";

import { deleteTask, getTaskById, updateTask } from "../services/taskServices";

import { useNotify } from "../hooks/useNotify";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../queryKeys";
import TaskEditModal from "./TaskEditModal";
import TaskDetailsModal from "./TaskDetailsModal";
import { Modal } from "antd";
import type { IColumnData } from "../types/columnData";
import {
  createSubtask,
  deleteSubtask,
  updateSubtask,
} from "../services/subtaskServices";
import type { IUpdateSubtaskRequest } from "../types/subtaskData";

interface ITaskCardProps {
  task: ITaskData;
  columns: IColumnData[];
}

const TaskCard: React.FC<ITaskCardProps> = ({ task, columns }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const notify = useNotify();

  const queryClient = useQueryClient();

  const { data: taskDetails, isPending: taskDetailsLoading } = useQuery({
    queryKey: queryKeys.task(task.id),
    queryFn: () => getTaskById(task.id),

    enabled: isModalOpen || isEditModalOpen,
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({
      taskId,
      request,
    }: {
      taskId: string;
      request: IUpdateTaskRequest;
    }) => updateTask(taskId, request),

    onSuccess: async (updatedTask) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.tasksByColumn(task.columnId),
      });

      if (updatedTask.columnId !== task.columnId) {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.tasksByColumn(updatedTask.columnId),
        });
      }

      await queryClient.invalidateQueries({
        queryKey: queryKeys.task(task.id),
      });

      await queryClient.invalidateQueries({
        queryKey: queryKeys.allTasks,
      });

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
    mutationFn: (taskId: string) => deleteTask(taskId),

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.tasksByColumn(task.columnId),
        }),

        queryClient.invalidateQueries({
          queryKey: queryKeys.allTasks,
        }),
      ]);

      queryClient.removeQueries({
        queryKey: queryKeys.task(task.id),
      });

      setIsModalOpen(false);

      notify.success(
        "Task deleted",
        `"${task.title}" was deleted successfully.`,
      );
    },

    onError: (error) => {
      console.error("Failed to delete task:", error);

      notify.error("Delete failed", "The task could not be deleted.");
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
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.task(task.id),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.tasksByColumn(task.columnId),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.allTasks,
        }),
      ]);
    },

    onError: (error) => {
      console.log("Failed to update subtask:", error);

      notify.error("Subtask update failed", "Please try again.");
    },
  });

  const editTaskMutation = useMutation({
    mutationFn: async (values: EditTaskValues) => {
      if (!taskDetails) {
        throw new Error("Task details are not loaded");
      }

      const submittedSubtasks = values.subtasks ?? [];

      const submittedIds = new Set(
        submittedSubtasks
          .filter((subtask) => subtask.id)
          .map((subtask) => subtask.id as string),
      );

      const subtasksToDelete = taskDetails.subtasks.filter(
        (subtask) => !submittedIds.has(subtask.id),
      );

      const subtasksToCreate = submittedSubtasks.filter(
        (subtask) => !subtask.id,
      );

      const subtasksToUpdate = submittedSubtasks.filter((subtask) => {
        if (!subtask.id) return false;

        const existing = taskDetails.subtasks.find(
          (item) => item.id === subtask.id,
        );

        return existing && existing.title !== subtask.title.trim();
      });

      const taskRequest: IUpdateTaskRequest = {
        columnId: values.columnId,
        title: values.title.trim(),
        description: values.description ?? "",

        subtasks: taskDetails.subtasks.map((subtask) => ({
          id: subtask.id,
          title: subtask.title,
          isCompleted: subtask.isCompleted,
        })),
      };

      const updatedTask = await updateTask(task.id, taskRequest);

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
          const existing = taskDetails.subtasks.find(
            (item) => item.id === subtask.id,
          )!;

          return updateSubtask(subtask.id!, {
            taskId: task.id,
            title: subtask.title.trim(),
            isCompleted: existing.isCompleted,
          });
        }),
      ]);

      return updatedTask;
    },

    onSuccess: async (updatedTask) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.tasksByColumn(task.columnId),
        }),

        queryClient.invalidateQueries({
          queryKey: queryKeys.task(task.id),
        }),

        queryClient.invalidateQueries({
          queryKey: queryKeys.allTasks,
        }),
      ]);

      if (updatedTask.columnId !== task.columnId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.tasksByColumn(updatedTask.columnId),
        });
      }
      setIsEditModalOpen(false);

      notify.success("Task updated", "Changes saved successfully.");
    },

    onError: (error) => {
      console.error("Failed to edit task:", error);

      notify.error("Task update failed", "Please try again.");
    },
  });

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleStatusChange = (newColumnId: string) => {
    if (!taskDetails) return;

    const request: IUpdateTaskRequest = {
      columnId: newColumnId,
      title: taskDetails.title,
      description: taskDetails.description,
      subtasks: taskDetails.subtasks.map((subtask) => ({
        id: subtask.id,
        title: subtask.title,
        isCompleted: subtask.isCompleted,
      })),
    };

    updateTaskMutation.mutate({
      taskId: task.id,
      request,
    });
  };

  const handleSubtaskChange = (checkedValues: string[]) => {
    if (!taskDetails) return;

    const changedSubtasks = taskDetails.subtasks.filter(
      (subtask) => checkedValues.includes(subtask.id) !== subtask.isCompleted,
    );

    changedSubtasks.forEach((subtask) => {
      updateSubtaskMutation.mutate({
        subtaskId: subtask.id,
        request: {
          taskId: task.id,
          title: subtask.title,
          isCompleted: checkedValues.includes(subtask.id),
        },
      });
    });
  };

  const handleDeleteTask = () => {
    Modal.confirm({
      title: "Delete this task?",
      content: `Are you sure you want to delete "${task.title}"`,
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",

      onOk: () => deleteTaskMutation.mutateAsync(task.id),
    });
  };

  const showEditModal = () => {
    setIsModalOpen(false);
    setIsEditModalOpen(true);
  };

  const handleEditTask = (values: EditTaskValues) => {
    editTaskMutation.mutate(values);
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
          {task.title}
        </p>

        <p
          style={{
            color: "#828fa3",
            fontSize: "12px",
            fontWeight: 600,
          }}
        >
          {task.completedSubtasks} of {task.totalSubtasks} subtasks
        </p>
      </div>
      {isModalOpen && taskDetailsLoading && (
        <Modal open footer={null} onCancel={() => setIsModalOpen(false)}>
          Loading task...
        </Modal>
      )}
      {isModalOpen && taskDetails && (
        <TaskDetailsModal
          open={isModalOpen}
          task={taskDetails}
          columns={columns}
          onClose={() => setIsModalOpen(false)}
          onEdit={showEditModal}
          onDelete={handleDeleteTask}
          onStatusChange={handleStatusChange}
          onSubtaskChange={handleSubtaskChange}
        />
      )}
      {isEditModalOpen && taskDetails && (
        <TaskEditModal
          open={isEditModalOpen}
          task={taskDetails}
          columns={columns}
          loading={editTaskMutation.isPending}
          onCancel={() => setIsEditModalOpen(false)}
          onSubmit={handleEditTask}
        />
      )}
    </>
  );
};

export default memo(TaskCard);

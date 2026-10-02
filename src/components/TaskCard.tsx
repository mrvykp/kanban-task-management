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
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.tasksByBoard(task.boardId),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.task(task.id),
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
    mutationFn: (taskId: string) => deleteTask(taskId),

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.tasksByBoard(task.boardId),
        }),
        queryClient.removeQueries({
          queryKey: queryKeys.task(task.id),
        }),
      ]);

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

  const numberOfSubtasks = task.totalSubtasks;

  // const checkedCount = data.subtasks.filter(
  //   (subtask) => subtask.isCompleted,
  // ).length;

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

    const updatedSubtasks = taskDetails.subtasks.map((subtask) => ({
      id: subtask.id,
      title: subtask.title,
      isCompleted: checkedValues.includes(subtask.id),
    }));

    const request: IUpdateTaskRequest = {
      columnId: taskDetails.columnId,
      title: taskDetails.title,
      description: taskDetails.description,
      subtasks: updatedSubtasks,
    };

    updateTaskMutation.mutate({
      taskId: task.id,
      request,
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

  // const handleEditTask = (values: EditTaskValues) => {
  //   const now = Date.now();

  //   const updatedSubtasks = values.subtasks.map((subtask, index) => {
  //     const existingSubtask = task.subtasks.find(
  //       (item) => item.id === subtask.id,
  //     );

  //     return {
  //       id: subtask.id ?? now + index,
  //       title: subtask.title,
  //       isCompleted: existingSubtask?.isCompleted ?? false,
  //     };
  //   });

  //   const updates: IUpdateTaskRequest = {
  //     title: values.title,
  //     description: values.description ?? "",
  //     status: values.status,
  //     subtasks: updatedSubtasks,
  //   };

  //   updateTaskMutation.mutate(
  //     {
  //       taskId: data.id,
  //       updates,
  //     },
  //     {
  //       onSuccess: () => {
  //         setIsEditModalOpen(false);
  //       },
  //     },
  //   );
  // };

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
      {/* <TaskEditModal
        open={isEditModalOpen}
        task={data}
        columns={columns}
        loading={updateTaskMutation.isPending}
        onCancel={() => setIsEditModalOpen(false)}
        onSubmit={handleEditTask}
      /> */}
    </>
  );
};

export default memo(TaskCard);

import {
  Checkbox,
  Dropdown,
  Modal,
  Select,
  type CheckboxOptionType,
  type MenuProps,
} from "antd";
import type { ITaskData } from "../types/taskData";
import { MoreOutlined } from "@ant-design/icons";

interface TaskDetailsModalProps {
  open: boolean;
  task: ITaskData;
  columns: string[];

  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;

  onStatusChange: (status: string) => void;
  onSubtaskChange: (checkedValues: (string | number)[]) => void;

  showActions?: boolean;
}

const TaskDetailsModal = ({
  open,
  task,
  columns,
  onClose,
  onEdit,
  onDelete,
  onStatusChange,
  onSubtaskChange,
  showActions = true,
}: TaskDetailsModalProps) => {
  const numberOfSubtasks = task.subtasks.length;

  const checkedCount = task.subtasks.filter(
    (subtask) => subtask.isCompleted,
  ).length;

  const checkedSubtaskIds = task.subtasks
    .filter((subtask) => subtask.isCompleted)
    .map((subtask) => subtask.id);

  const options: CheckboxOptionType<number>[] = task.subtasks.map(
    (subtask) => ({
      label: subtask.title,
      value: subtask.id,
    }),
  );

  const menuItems: MenuProps["items"] = [
    {
      key: "edit",
      label: "Edit Task",
    },
    {
      key: "delete",
      label: "Delete Task",
      danger: true,
    },
  ];
  return (
    <Modal
      title={
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>{task.title}</span>
          {showActions && (
            <Dropdown
              trigger={["click"]}
              menu={{
                items: menuItems,
                onClick: ({ key }) => {
                  if (key === "edit") {
                    onEdit?.();
                  }
                  if (key === "delete") {
                    onDelete?.();
                  }
                },
              }}
            >
              <MoreOutlined
                style={{
                  fontSize: "22px",
                  cursor: "pointer",
                }}
              />
            </Dropdown>
          )}
        </div>
      }
      closable={false}
      open={open}
      onCancel={onClose}
      footer={null}
    >
      <p
        style={{
          color: "#828fa3",
          fontSize: "12px",
          fontWeight: 600,
          margin: "25px 0",
        }}
      >
        {task.description}
      </p>
      <p
        style={{
          color: "#788394",
          fontSize: "12px",
          fontWeight: 700,
        }}
      >
        Subtasks {checkedCount} of {numberOfSubtasks}
      </p>
      <Checkbox.Group
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
        options={options}
        onChange={onSubtaskChange}
        value={checkedSubtaskIds}
      />

      <p
        style={{
          color: "#788394",
          fontSize: "12px",
          fontWeight: 700,
          marginTop: "20px",
        }}
      >
        Current status
      </p>

      <Select
        value={task.status}
        style={{ width: "100%" }}
        onChange={onStatusChange}
        options={columns.map((column) => ({
          value: column,
          label: column.toUpperCase(),
        }))}
      />
    </Modal>
  );
};

export default TaskDetailsModal;

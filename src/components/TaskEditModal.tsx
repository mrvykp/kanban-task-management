import { Button, Form, Input, Modal, Select } from "antd";
import type { EditTaskValues, ITaskDetails } from "../types/taskData";
import { useEffect } from "react";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import type { IColumnData } from "../types/columnData";

interface TaskEditModalProps {
  open: boolean;
  task: ITaskDetails;
  columns: IColumnData[];
  loading: boolean;

  onCancel: () => void;
  onSubmit: (values: EditTaskValues) => void;
}
const TaskEditModal = ({
  open,
  task,
  columns,
  loading,
  onCancel,
  onSubmit,
}: TaskEditModalProps) => {
  const [form] = Form.useForm<EditTaskValues>();

  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        title: task.title,
        description: task.description,
        columnId: task.columnId,
        subtasks: task.subtasks.map((subtask) => ({
          id: subtask.id,
          title: subtask.title,
        })),
      });
    }
  }, [open, task, form]);

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal title="Edit Task" open={open} onCancel={handleCancel} footer={null}>
      <Form form={form} layout="vertical" onFinish={onSubmit}>
        <Form.Item
          label="Title"
          name="title"
          rules={[{ required: true, message: "Please enter a task title" }]}
        >
          <Input />
        </Form.Item>

        <Form.Item label="Description" name="description">
          <Input.TextArea
            autoSize={{
              minRows: 4,
              maxRows: 8,
            }}
          />
        </Form.Item>

        <Form.Item label="Subtasks">
          <Form.List name="subtasks">
            {(fields, { add, remove }) => (
              <>
                {fields.map((field) => (
                  <div
                    key={field.key}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "12px",
                    }}
                  >
                    <Form.Item name={[field.name, "id"]} hidden>
                      <Input />
                    </Form.Item>
                    <Form.Item
                      name={[field.name, "title"]}
                      style={{ flex: 1, marginBottom: 0 }}
                      rules={[
                        {
                          required: true,
                          whitespace: true,
                          message: "Please enter a subtask title",
                        },
                      ]}
                    >
                      <Input />
                    </Form.Item>

                    <MinusCircleOutlined onClick={() => remove(field.name)} />
                  </div>
                ))}

                <Button
                  type="primary"
                  onClick={() => add({ id: undefined, title: "" })}
                  icon={<PlusOutlined />}
                  style={{
                    width: "100%",
                    backgroundColor: "#F0EFFA",
                    color: "#635FC7",
                    borderRadius: "20px",
                  }}
                >
                  Add New Subtask
                </Button>
              </>
            )}
          </Form.List>
        </Form.Item>

        <Form.Item
          label="Status"
          name="columnId"
          rules={[
            {
              required: true,
              message: "Please select a status",
            },
          ]}
        >
          <Select
            options={columns.map((column) => ({
              value: column.id,
              label: column.name.toUpperCase(),
            }))}
          />
        </Form.Item>

        <Button
          type="primary"
          htmlType="submit"
          loading={loading}
          style={{
            width: "100%",
            height: "40px",
            borderRadius: "20px",
            backgroundColor: "#635FC7",
          }}
        >
          Save Changes
        </Button>
      </Form>
    </Modal>
  );
};

export default TaskEditModal;

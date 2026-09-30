import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import {
  Button,
  Col,
  Form,
  Input,
  Layout,
  Modal,
  Row,
  Segmented,
  Select,
} from "antd";
import Title from "antd/es/typography/Title";
import { useState } from "react";
import { createStyles } from "antd-style";
import TextArea from "antd/es/input/TextArea";
import type { IBoardData } from "../types/boardData";
import type { ICreateTaskRequest } from "../types/taskData";
import { createTask } from "../services/taskServices";
import { useNotify } from "../hooks/useNotify";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../queryKeys";
import { useNavigate } from "react-router-dom";

const { Header } = Layout;

interface HeaderProps {
  board: IBoardData;
  view: "kanban" | "tasks";
}

const HeaderContainer = ({ board, view }: HeaderProps) => {
  const [form] = Form.useForm();
  const notify = useNotify();

  const navigate = useNavigate();

  const queryClient = useQueryClient();

  const useStyles = createStyles((props) => {
    const { css, cssVar } = props;
    return {
      dynamicDeleteButton: css`
        position: relative;
        top: ${cssVar.marginXXS};
        margin: 0 ${cssVar.marginXS};
        color: #999;
        font-size: 24px;
        cursor: pointer;
        transition: all ${cssVar.motionDurationSlow} ease;
        &:hover {
          color: #777;
        }
        &[disabled] {
          cursor: not-allowed;
          opacity: 0.5;
        }
      `,
    };
  });

  const { styles } = useStyles();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const createTaskMutation = useMutation({
    mutationFn: (request: ICreateTaskRequest) => createTask(board.id, request),

    onSuccess: async (newTask) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.board(board.id),
        }),

        queryClient.invalidateQueries({ queryKey: queryKeys.boards }),
      ]);

      notify.success(
        "Task created",
        `"${newTask.title}" was created successfully.`,
      );

      form.resetFields();
      setIsModalOpen(false);
    },

    onError: (error) => {
      console.error("Failed to create task:", error);

      notify.error("Task creation failed", "Please try again.");
    },
  });

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const onFinish = async (values: {
    title: string;
    description: string;
    status: string;
    subtasks?: string[];
  }) => {
    const request: ICreateTaskRequest = {
      title: values.title,
      description: values.description ?? "",
      status: values.status,

      subtasks: (values.subtasks ?? []).map((title) => ({
        title,
        isCompleted: false,
      })),
    };

    createTaskMutation.mutate(request);
  };
  return (
    <Header style={{ paddingInline: 30 }}>
      <Row justify="space-between" align="middle" style={{ height: "100%" }}>
        <Col>
          <Title
            level={3}
            style={{
              color: "white",
              margin: 0,
            }}
          >
            {view === "kanban" ? board?.name : "Task List"}
          </Title>
        </Col>
        <Col
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          {view === "kanban" && (
            <Button type="primary" onClick={showModal}>
              + Add New Task
            </Button>
          )}

          <Segmented
            value={view}
            options={[
              { label: "Boards View", value: "kanban" },
              { label: "Tasks View", value: "tasks" },
            ]}
            onChange={(value) => {
              if (value === "kanban" && board) {
                navigate(`/boards/${board.id}`);
              }

              if (value === "tasks" && board) {
                navigate(`/tasks?boardId=${board.id}`);
              }
            }}
          />
        </Col>
      </Row>
      <Modal
        title="Add New Task"
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
      >
        <Form layout="vertical" onFinish={onFinish} form={form}>
          <div
            style={{
              width: "100%",
              margin: "0 auto",
            }}
          >
            <p
              style={{
                marginBottom: "8px",
                fontSize: "11px",
                color: "#8C8C8C",
              }}
            >
              Title
            </p>
            <Form.Item
              name="title"
              rules={[
                {
                  required: true,
                  message: "Please enter a task title",
                },
              ]}
            >
              <Input placeholder="e.g. Take coffee break" />
            </Form.Item>
            <p
              style={{
                marginBottom: "8px",
                fontSize: "11px",
                color: "#8C8C8C",
              }}
            >
              Description
            </p>
            <Form.Item name="description">
              <TextArea
                placeholder="e.g. It's always good to take a break. This 15 minutes break will recharge the batteries a little."
                autoSize={{ minRows: 5, maxRows: 8 }}
              />
            </Form.Item>

            <p
              style={{
                marginBottom: "8px",
                fontSize: "11px",
                color: "#8C8C8C",
              }}
            >
              Subtasks
            </p>
          </div>

          <Form.List name="subtasks">
            {(fields, { add, remove }, { errors }) => (
              <>
                {fields.map((field, index) => (
                  <Form.Item
                    key={field.key}
                    style={{
                      marginBottom: "12px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <Form.Item {...field} noStyle>
                        <Input placeholder="e.g Make a coffee" />
                      </Form.Item>

                      {index > 0 && (
                        <MinusCircleOutlined
                          className={styles.dynamicDeleteButton}
                          onClick={() => remove(field.name)}
                        />
                      )}
                    </div>
                  </Form.Item>
                ))}
                <Form.Item>
                  <Button
                    type="primary"
                    onClick={() => add()}
                    style={{
                      width: "100%",
                      height: "40px",
                      borderRadius: "20px",
                      backgroundColor: "#F0EFFA",
                      color: "#635FC7",
                      fontWeight: 500,
                    }}
                    icon={<PlusOutlined />}
                  >
                    Add New Subtask
                  </Button>

                  <Form.ErrorList errors={errors} />
                </Form.Item>
              </>
            )}
          </Form.List>
          <p
            style={{
              marginBottom: "8px",
              fontSize: "11px",
              color: "#8C8C8C",
            }}
          >
            Status
          </p>

          <Form.Item
            name="status"
            rules={[
              {
                required: true,
                message: "Please select a status",
              },
            ]}
          >
            <Select
              placeholder="Select the current status"
              options={board.columns.map((column) => ({
                value: column.name,
                label: column.name.toUpperCase(),
              }))}
            />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={createTaskMutation.isPending}
              style={{
                width: "100%",
                height: "40px",
                borderRadius: "20px",
                backgroundColor: "#635FC7",
                fontWeight: 600,
              }}
            >
              Create New Task
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </Header>
  );
};

export default HeaderContainer;

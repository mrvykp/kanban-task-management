import { Button, Col, Form, Input, Layout, Modal, Row, theme } from "antd";
import TaskCard from "./TaskCard";
import type { IBoardData, IUpdateBoardRequest } from "../types/boardData";
import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateBoard } from "../services/boardServices";
import { queryKeys } from "../queryKeys";
import { useNotify } from "../hooks/useNotify";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { createStyles } from "antd-style";

const { Content } = Layout;

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

interface TaskContainerProps {
  board: IBoardData;
}

const TasksContainer = ({ board }: TaskContainerProps) => {
  const [editingBoard, setEditingBoard] = useState<IBoardData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const notify = useNotify();
  const { styles } = useStyles();

  const updateBoardMutation = useMutation({
    mutationFn: ({
      boardId,
      request,
    }: {
      boardId: string;
      request: IUpdateBoardRequest;
    }) => updateBoard(boardId, request),

    onSuccess: (updatedBoard) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.boards,
      });

      queryClient.invalidateQueries({
        queryKey: queryKeys.board(updatedBoard.id),
      });

      notify.success("Board updated", "Changes saved successfully.");

      form.resetFields();
      setEditingBoard(null);
      setIsModalOpen(false);
    },

    onError: (error) => {
      console.error("Failed to update board:", error);
      notify.error("Failed to update board", "Please try again.");
    },
  });

  const {
    token: { colorBgContainer },
  } = theme.useToken();
  const columnNamesKey = board.columns.map((column) => column.name).join("|");

  const columnNames = useMemo(
    () => board.columns.map((column) => column.name),
    [columnNamesKey],
  );

  const showEditModal = (board: IBoardData) => {
    setEditingBoard(board);

    form.setFieldsValue({
      columns: board.columns.map((column) => column.name),
    });

    setIsModalOpen(true);
    console.log(board);
  };

  const onSubmit = (values: { columns: string[] }) => {
    if (!editingBoard) return;
    const request: IUpdateBoardRequest = {
      name: editingBoard.name,
      columns: values.columns.map((column) => {
        const trimmedName = column.trim();

        const existingColumn = editingBoard.columns.find(
          (column) => column.name.toLowerCase() === trimmedName.toLowerCase(),
        );

        return {
          name: trimmedName,
          tasks: existingColumn?.tasks ?? [],
        };
      }),
    };

    updateBoardMutation.mutate({
      boardId: editingBoard.id,
      request,
    });
    return;
  };

  const handleCancel = () => {
    form.resetFields();
    setEditingBoard(null);
    setIsModalOpen(false);
  };
  return (
    <Content
      style={{
        flex: 1,
        minHeight: 0,
        overflowY: "auto",
        overflowX: "auto",
        padding: 24,
        background: colorBgContainer,
      }}
    >
      <Row>
        <Col flex="0 0 80%">
          <Row gutter={[16, 24]}>
            {board.columns.map((column) => (
              <Col key={column.name} lg={8} sm={12} xs={24}>
                <p style={{ color: "grey", fontSize: "11px" }}>
                  {column.name.toUpperCase()} ({column.tasks.length})
                </p>
                {column.tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    data={task}
                    boardId={board.id}
                    columns={columnNames}
                  />
                ))}
              </Col>
            ))}
          </Row>
        </Col>

        <Col flex="0 0 20%">
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              cursor: "pointer",
            }}
            onClick={() => showEditModal(board)}
          >
            + Add new Col
          </div>
        </Col>
      </Row>

      <Modal
        title={"Edit The Columns"}
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
      >
        <Form layout="vertical" onFinish={onSubmit} form={form}>
          <p
            style={{
              marginBottom: "8px",
              fontSize: "11px",
              color: "#8C8C8C",
            }}
          >
            Columns
          </p>
          <Form.List
            name="columns"
            rules={[
              {
                validator: async (_, columns: string[] = []) => {
                  const normalizedColumns = columns.map((column) =>
                    column.trim().toLowerCase(),
                  );

                  const hasDuplicates =
                    new Set(normalizedColumns).size !==
                    normalizedColumns.length;

                  if (hasDuplicates) {
                    return Promise.reject(
                      new Error("Column names must be unique"),
                    );
                  }

                  return Promise.resolve();
                },
              },
            ]}
          >
            {(fields, { add, remove }, { errors }) => (
              <div
                style={{
                  width: "100%",
                  margin: "0 auto",
                }}
              >
                {fields.map((field) => (
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
                      <Form.Item
                        {...field}
                        noStyle
                        rules={[
                          {
                            required: true,
                            whitespace: true,
                            message: "Please enter a column name",
                          },
                        ]}
                      >
                        <Input placeholder="e.g. To Do" />
                      </Form.Item>

                      {fields.length > 1 && (
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
                    onClick={() => add("")}
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
                    Add New Column
                  </Button>

                  <Form.ErrorList errors={errors} />
                </Form.Item>
              </div>
            )}
          </Form.List>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              style={{
                width: "100%",
                height: "40px",
                borderRadius: "20px",
                backgroundColor: "#635FC7",
                fontWeight: 600,
              }}
              loading={updateBoardMutation.isPending}
            >
              {"Save Changes"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </Content>
  );
};

export default TasksContainer;

import { Button, Col, Form, Input, Layout, Modal, Row, theme } from "antd";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../queryKeys";
import { useNotify } from "../hooks/useNotify";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { createStyles } from "antd-style";
import {
  createColumn,
  deleteColumn,
  getColumnsByBoard,
  updateColumn,
} from "../services/columnServices";
import { useBoardStore } from "../stores/boardStore";
import TaskColumn from "./TaskColumn";

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

interface ColumnFormValue {
  id?: string;
  name: string;
}

interface ColumnFormValues {
  columns: ColumnFormValue[];
}

const TasksContainer = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const notify = useNotify();
  const { styles } = useStyles();

  const selectedBoard = useBoardStore((state) => state.selectedBoard);

  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const boardId = selectedBoard?.id ?? "";

  const {
    data: columns = [],
    isPending: columnsLoading,
    isError: columnsError,
  } = useQuery({
    queryKey: queryKeys.columns(boardId),
    queryFn: () => getColumnsByBoard(boardId),

    enabled: !!selectedBoard,
  });

  const saveColumnsMutation = useMutation({
    mutationFn: async (formColumns: ColumnFormValue[]) => {
      const submittedColumns = formColumns.map((column) => ({
        ...column,
        name: column.name.trim(),
      }));

      const submittedIds = new Set(
        submittedColumns
          .filter((column) => column.id)
          .map((column) => column.id as string),
      );

      const columnsToDelete = columns.filter(
        (column) => !submittedIds.has(column.id),
      );

      const columnsToCreate = submittedColumns.filter((column) => !column.id);

      const columnsToUpdate = submittedColumns.filter((column) => {
        if (!column.id) return false;

        const existingColumn = columns.find(
          (existing) => existing.id === column.id,
        );

        return existingColumn && existingColumn.name !== column.name;
      });

      await Promise.all([
        ...columnsToDelete.map((column) => deleteColumn(column.id)),

        ...columnsToCreate.map((column) =>
          createColumn({
            boardId: boardId,
            name: column.name,
          }),
        ),

        ...columnsToUpdate.map((column) =>
          updateColumn(column.id!, {
            boardId: boardId,
            name: column.name,
          }),
        ),
      ]);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.columns(boardId),
        }),

        queryClient.invalidateQueries({
          queryKey: queryKeys.tasksByBoard(boardId),
        }),

        queryClient.invalidateQueries({
          queryKey: queryKeys.board(boardId),
        }),
      ]);

      notify.success("Columns updated", "Changes saved successfully.");

      form.resetFields();
      setIsModalOpen(false);
    },

    onError: (error) => {
      console.error("Failed to update board:", error);
      notify.error("Column update failed", "Please try again.");
    },
  });

  if (!selectedBoard) {
    return null;
  }

  const showEditModal = () => {
    form.setFieldsValue({
      columns:
        columns.length > 0
          ? columns.map((column) => ({ id: column.id, name: column.name }))
          : [{ name: "" }],
    });

    setIsModalOpen(true);
  };

  const handleCancel = () => {
    form.resetFields();
    setIsModalOpen(false);
  };

  const onSubmit = (values: ColumnFormValues) => {
    saveColumnsMutation.mutate(values.columns);
  };

  if (columnsLoading) {
    return <Content>Loading...</Content>;
  }

  if (columnsError) {
    return <Content>Failed to load board data.</Content>;
  }

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
            {columns.map((column) => (
              <TaskColumn
                key={column.id}
                boardId={boardId}
                column={column}
                columns={columns}
              />
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
            onClick={showEditModal}
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
                validator: async (
                  _,
                  columns: ColumnFormValue[] | undefined,
                ) => {
                  const normalizedColumns = (columns ?? []).map((column) =>
                    column.name.trim().toLowerCase(),
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
                      name={[field.name, "name"]}
                      style={{ flex: 1, marginBottom: 0 }}
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
                ))}

                <Form.Item>
                  <Button
                    type="primary"
                    onClick={() => add({ name: "" })}
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
              loading={saveColumnsMutation.isPending}
            >
              Save Changes
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </Content>
  );
};

export default TasksContainer;

import { useState } from "react";
import {
  MinusCircleOutlined,
  MoreOutlined,
  PlusOutlined,
  RightCircleTwoTone,
} from "@ant-design/icons";
import {
  Button,
  Dropdown,
  Form,
  Input,
  Layout,
  Menu,
  Modal,
  type MenuProps,
} from "antd";
import logoLight from "../assets/logo-light.svg";
import logoMobile from "../assets/logo-mobile.svg";
import boardIcon from "../assets/icon-board.svg";
import { createStyles } from "antd-style";
import type {
  IBoardData,
  ICreateBoardRequest,
  IUpdateBoardRequest,
} from "../types/boardData";
import { useNavigate, useParams } from "react-router-dom";
import {
  createBoard,
  deleteBoard,
  updateBoard,
} from "../services/boardServices";
import { useNotify } from "../hooks/useNotify";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../queryKeys";
import { useBoardStore } from "../stores/boardStore";

const { Sider } = Layout;

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

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBoard, setEditingBoard] = useState<IBoardData | null>(null);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { boardId } = useParams();
  const { styles } = useStyles();
  const notify = useNotify();

  const boards = useBoardStore((state) => state.boards);

  const queryClient = useQueryClient();

  const createBoardMutation = useMutation({
    mutationFn: createBoard,

    onSuccess: (createdBoard) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.boards,
      });
      notify.success(
        "Board created",
        `"${createdBoard.name}" was created successfully.`,
      );
      form.resetFields();
      setEditingBoard(null);
      setIsModalOpen(false);

      navigate(`/boards/${createdBoard.id}`);
    },

    onError: (error) => {
      notify.error("Failed to create board", "Please try again.");
      console.log(error);
    },
  });

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

  const deleteBoardMutation = useMutation({
    mutationFn: (board: IBoardData) => deleteBoard(board.id),

    onSuccess: (_, deletedBoard) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.boards,
      });

      queryClient.removeQueries({
        queryKey: queryKeys.board(deletedBoard.id),
      });

      notify.success(
        "Board deleted",
        `"${deletedBoard.name}" was deleted successfully.`,
      );

      if (deletedBoard.id === boardId) {
        const remainingBoards = boards.filter(
          (board) => board.id !== deletedBoard.id,
        );
        if (remainingBoards.length > 0) {
          navigate(`/boards/${remainingBoards[0].id}`);
        } else {
          navigate("/");
        }
      }
    },

    onError: (error) => {
      console.error("Failed to delete board:", error);

      notify.error("Delete failed", "The board could not be deleted.");
    },
  });

  const items = boards.map((board) => {
    const dropdownItems: MenuProps["items"] = [
      {
        key: "edit",
        label: "Edit Board",
      },
      {
        key: "delete",
        label: "Delete Board",
        danger: true,
      },
    ];

    return {
      key: board.id,

      icon: <img src={boardIcon} alt="" style={{ width: 16, height: 16 }} />,

      label: (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <div
            style={{
              width: "25ch",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            <span>{board.name}</span>
          </div>

          <Dropdown
            trigger={["click"]}
            menu={{
              items: dropdownItems,

              onClick: ({ key, domEvent }) => {
                domEvent.stopPropagation();

                if (key === "edit") {
                  showEditModal(board);
                }

                if (key === "delete") {
                  handleDeleteBoard(board);
                }
              },
            }}
          >
            <MoreOutlined
              onClick={(event) => {
                event.stopPropagation();
              }}
              style={{
                fontSize: "18px",
                cursor: "pointer",
              }}
            />
          </Dropdown>
        </div>
      ),
    };
  });

  const showCreateModal = () => {
    setEditingBoard(null);
    form.resetFields();

    form.setFieldsValue({
      columns: [""],
    });

    setIsModalOpen(true);
  };

  const showEditModal = (board: IBoardData) => {
    setEditingBoard(board);

    form.setFieldsValue({
      name: board.name,
    });

    setIsModalOpen(true);
  };

  const handleDeleteBoard = (board: IBoardData) => {
    Modal.confirm({
      title: "Delete this board?",
      content: `Are you sure you want to delete "${board.name}"?`,
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",

      onOk: async () => deleteBoardMutation.mutateAsync(board),
    });
  };

  const onFinish = (values: { name: string; columns: string[] }) => {
    if (editingBoard) {
      const request: IUpdateBoardRequest = {
        name: values.name,
        // columns: values.columns.map((column) => {
        //   const trimmedName = column.trim();

        //   const existingColumn = editingBoard.columns.find(
        //     (column) => column.name.toLowerCase() === trimmedName.toLowerCase(),
        //   );

        //   return {
        //     name: trimmedName,
        //     tasks: existingColumn?.tasks ?? [],
        //   };
        // }),
      };

      updateBoardMutation.mutate({
        boardId: editingBoard.id,
        request,
      });

      return;
    }

    const request: ICreateBoardRequest = {
      name: values.name,

      columns: values.columns.map((column) => ({
        name: column.trim(),
      })),
    };

    createBoardMutation.mutate(request);
  };

  const handleCancel = () => {
    form.resetFields();
    setEditingBoard(null);
    setIsModalOpen(false);
  };

  return (
    <Sider trigger={null} collapsible collapsed={collapsed}>
      <div
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div className="demo-logo-vertical" />
        {collapsed ? (
          <img
            src={logoMobile}
            alt="Kanban"
            style={{
              width: "24px",
              margin: "30px auto 20px",
              display: "block",
            }}
          />
        ) : (
          <img
            src={logoLight}
            alt="Kanban"
            style={{
              width: "150px",
              marginLeft: "27px",
              marginTop: "30px",
              marginBottom: "20px",
            }}
          />
        )}
        {!collapsed && (
          <p style={{ color: "grey", marginLeft: "27px", fontSize: "11px" }}>
            All Boards
          </p>
        )}
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={boardId ? [boardId] : []}
          items={items}
          onClick={({ key }) => {
            navigate(`/boards/${key}`);
          }}
        />
        {!collapsed && (
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              paddingLeft: "29px",
              cursor: "pointer",
            }}
            onClick={showCreateModal}
          >
            <img
              src={boardIcon}
              alt=""
              style={{ width: "16px", height: "16px" }}
            />
            <p style={{ color: "white", marginLeft: "8px" }}>
              + Create New Board
            </p>
          </div>
        )}
        <Button
          type="text"
          onClick={() => setCollapsed(!collapsed)}
          style={{
            fontSize: "16px",
            width: "100%",
            height: 64,
            color: "white",
            marginTop: "auto",
          }}
        >
          {collapsed ? <RightCircleTwoTone /> : "Hide the sidebar"}
        </Button>
      </div>
      <Modal
        title={editingBoard ? "Edit The Board" : "Add New Board"}
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
      >
        <Form layout="vertical" onFinish={onFinish} form={form}>
          <p
            style={{
              marginBottom: "8px",
              fontSize: "11px",
              color: "#8C8C8C",
            }}
          >
            Name
          </p>
          <Form.Item
            name="name"
            rules={[{ required: true, message: "Please enter a board name" }]}
          >
            <Input placeholder="e.g Web Design" />
          </Form.Item>
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
              loading={
                createBoardMutation.isPending || updateBoardMutation.isPending
              }
            >
              {editingBoard ? "Save Changes" : "Create New Board"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </Sider>
  );
};

export default Sidebar;

import { Layout } from "antd";
import Sidebar from "../components/Sidebar";
import HeaderContainer from "../components/HeaderContainer";
import TasksContainer from "../components/TasksContainer";
import { getAllBoards, getBoardById } from "../services/boardServices";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../queryKeys";

const BoardPage = () => {
  const { boardId } = useParams();

  // const selectedBoard = boards.find((board) => String(board.id) === boardId);

  const {
    data: boards = [],
    isPending: boardsLoading,
    isError: boardsError,
  } = useQuery({
    queryKey: queryKeys.boards,
    queryFn: getAllBoards,
  });

  const {
    data: selectedBoard,
    isPending: boardLoading,
    isError: boardError,
  } = useQuery({
    queryKey: queryKeys.board(boardId ?? ""),
    queryFn: () => getBoardById(boardId!),

    enabled: !!boardId,
  });

  if (boardsLoading || boardLoading) {
    return <p>Loading...</p>;
  }

  if (boardsError || boardError) {
    return <p>Something went wrong</p>;
  }

  if (!selectedBoard) {
    return <p>Board not found</p>;
  }
  return (
    <Layout
      style={{
        height: "100vh",
        overflow: "hidden",
      }}
    >
      <Sidebar boards={boards} />
      <Layout
        style={{
          height: "100vh",
          overflow: "hidden",
        }}
      >
        <HeaderContainer board={selectedBoard} view="kanban" />
        <TasksContainer board={selectedBoard} />
      </Layout>
    </Layout>
  );
};

export default BoardPage;

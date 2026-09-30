import { useQuery } from "@tanstack/react-query";
import { Button } from "antd";
import { useNavigate } from "react-router-dom";
import { queryKeys } from "../queryKeys";
import { getAllBoards } from "../services/boardServices";

const HomePage = () => {
  const navigate = useNavigate();

  const { data: boards = [], isPending } = useQuery({
    queryKey: queryKeys.boards,
    queryFn: getAllBoards,
  });

  const handleNavigate = () => {
    if (boards.length === 0) return;

    const firstBoard = boards[0];

    navigate(`/boards/${firstBoard.id}`);
  };
  return (
    <div>
      <p>Welcome to Homepage!</p>
      <Button loading={isPending} type="primary" onClick={handleNavigate}>
        Go to Task Container
      </Button>
    </div>
  );
};

export default HomePage;

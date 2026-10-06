import { useQuery } from "@tanstack/react-query";
import type { IColumnData } from "../types/columnData";
import { queryKeys } from "../queryKeys";
import { getTasks } from "../services/taskServices";
import { Col } from "antd";
import TaskCard from "./TaskCard";

interface TaskColumnProps {
  boardId: string;
  column: IColumnData;
  columns: IColumnData[];
}

const TaskColumn = ({ boardId, column, columns }: TaskColumnProps) => {
  const {
    data: tasks = [],
    isPending,
    isError,
  } = useQuery({
    queryKey: queryKeys.tasksByColumn(column.id),

    queryFn: () =>
      getTasks({
        boardId,
        columnId: column.id,
      }),
  });

  if (isPending) {
    return (
      <Col lg={8} sm={12} xs={24}>
        Loading...
      </Col>
    );
  }

  if (isError) {
    return (
      <Col lg={8} sm={12} xs={24}>
        Failed to load tasks.
      </Col>
    );
  }
  return (
    <Col lg={8} sm={12} xs={24}>
      <p style={{ color: "grey", fontSize: "11px" }}>
        {column.name.toUpperCase()} ({tasks.length})
      </p>

      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} columns={columns} />
      ))}
    </Col>
  );
};

export default TaskColumn;

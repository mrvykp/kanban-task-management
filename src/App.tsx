import { Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import BoardPage from "./pages/BoardPage";
import TaskListView from "./pages/TaskListView";

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/boards/:boardId" element={<BoardPage />} />
      <Route path="/tasks" element={<TaskListView />} />
    </Routes>
  );
}

export default App;

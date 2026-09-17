import { Button } from "antd";
import React from "react";
import { useNavigate } from "react-router-dom";

const HomePage = () => {
  const navigate = useNavigate();
  return (
    <div>
      <p>Welcome to Homepage!</p>
      <Button
        type="primary"
        onClick={() => {
          navigate("/boards/:boardId");
        }}
      >
        Go to Task Container
      </Button>
    </div>
  );
};

export default HomePage;

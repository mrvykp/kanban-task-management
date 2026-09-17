import { useState } from "react";
import {
  RightCircleTwoTone,
  UploadOutlined,
  UserOutlined,
  VideoCameraOutlined,
} from "@ant-design/icons";
import { Button, Layout, Menu } from "antd";

const { Sider } = Layout;

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Sider trigger={null} collapsible collapsed={collapsed}>
      <div className="demo-logo-vertical" />
      <Menu
        theme="dark"
        mode="inline"
        defaultSelectedKeys={["1"]}
        items={[
          {
            key: "1",
            icon: <UserOutlined />,
            label: "nav 1",
          },
          {
            key: "2",
            icon: <VideoCameraOutlined />,
            label: "nav 2",
          },
          {
            key: "3",
            icon: <UploadOutlined />,
            label: "nav 3",
          },
        ]}
      />
      <Button
        type="text"
        onClick={() => setCollapsed(!collapsed)}
        // icon={collapsed && <R}
        style={{
          fontSize: "16px",
          width: 64,
          height: 64,
          color: "white",
        }}
      >
        {collapsed ? <RightCircleTwoTone /> : "Hide the sidebar"}
      </Button>
    </Sider>
  );
};

export default Sidebar;

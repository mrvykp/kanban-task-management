import { Layout, theme } from "antd";

const { Header } = Layout;

const HeaderContainer = () => {
  const {
    token: { colorBgContainer },
  } = theme.useToken();
  return (
    <Header style={{ padding: 0, background: colorBgContainer }}>Header</Header>
  );
};

export default HeaderContainer;

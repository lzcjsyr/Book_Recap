import { Layout, Menu } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  VideoCameraOutlined,
  UnorderedListOutlined,
  PlusOutlined,
} from '@ant-design/icons';

const { Header } = Layout;

function AppHeader() {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      key: '/projects',
      icon: <UnorderedListOutlined />,
      label: '项目列表',
    },
    {
      key: '/projects/create',
      icon: <PlusOutlined />,
      label: '创建项目',
    },
  ];

  return (
    <Header style={{ display: 'flex', alignItems: 'center' }}>
      <div
        style={{
          color: 'white',
          fontSize: '20px',
          marginRight: '50px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <VideoCameraOutlined />
        <span>书籍内容转视频系统</span>
      </div>
      <Menu
        theme="dark"
        mode="horizontal"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={({ key }) => navigate(key)}
        style={{ flex: 1, minWidth: 0 }}
      />
    </Header>
  );
}

export default AppHeader;

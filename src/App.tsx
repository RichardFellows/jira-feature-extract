import React, { useEffect } from 'react';
import { Layout, Tabs, Typography, theme } from 'antd';
import { 
  DatabaseOutlined, 
  SearchOutlined, 
  DownloadOutlined, 
  HistoryOutlined 
} from '@ant-design/icons';
import { ConnectionSetup } from '@/components/ConnectionSetup';
import { useConnectionStore } from '@/stores/connection-store';
import { useQueryStore } from '@/stores/query-store';

const { Header, Content } = Layout;
const { Title } = Typography;

const App: React.FC = () => {
  const { isConnected } = useConnectionStore();
  const { loadMetadata } = useQueryStore();
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  useEffect(() => {
    // Load JIRA metadata when connected
    if (isConnected) {
      loadMetadata();
    }
  }, [isConnected, loadMetadata]);

  const tabItems = [
    {
      key: 'connection',
      label: (
        <span>
          <DatabaseOutlined />
          Connection
        </span>
      ),
      children: <ConnectionSetup />,
    },
    {
      key: 'query',
      label: (
        <span>
          <SearchOutlined />
          Query & Results
        </span>
      ),
      children: <div>Query Builder Component (Coming Soon)</div>,
      disabled: !isConnected,
    },
    {
      key: 'export',
      label: (
        <span>
          <DownloadOutlined />
          Export
        </span>
      ),
      children: <div>Export Component (Coming Soon)</div>,
      disabled: !isConnected,
    },
    {
      key: 'history',
      label: (
        <span>
          <HistoryOutlined />
          History
        </span>
      ),
      children: <div>Query History Component (Coming Soon)</div>,
      disabled: !isConnected,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ 
        display: 'flex', 
        alignItems: 'center',
        background: colorBgContainer,
        borderBottom: '1px solid #f0f0f0'
      }}>
        <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
          JIRA Feature Extractor
        </Title>
      </Header>
      
      <Content style={{ padding: '24px' }}>
        <div style={{ 
          background: colorBgContainer,
          minHeight: 'calc(100vh - 112px)',
          padding: '24px',
          borderRadius: '8px'
        }}>
          <Tabs
            defaultActiveKey="connection"
            items={tabItems}
            size="large"
            type="card"
            style={{ height: '100%' }}
            tabBarStyle={{ marginBottom: '24px' }}
          />
        </div>
      </Content>
    </Layout>
  );
};

export default App;
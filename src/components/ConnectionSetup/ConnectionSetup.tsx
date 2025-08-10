import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Alert, Card, Space, Typography, Tooltip } from 'antd';
import { UserOutlined, KeyOutlined, LinkOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useConnectionStore } from '@/stores/connection-store';

const { Title, Text, Link } = Typography;

interface ConnectionFormData {
  serverUrl: string;
  email: string;
  token: string;
}

export const ConnectionSetup: React.FC = () => {
  const [form] = Form.useForm();
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  
  const {
    serverUrl,
    email,
    token,
    isConnected,
    isLoading,
    error,
    userInfo,
    connect,
    disconnect,
    clearError,
  } = useConnectionStore();

  useEffect(() => {
    // Initialize form with stored values
    form.setFieldsValue({
      serverUrl,
      email,
      token,
    });
  }, [form, serverUrl, email, token]);

  const handleSubmit = async (values: ConnectionFormData) => {
    clearError();
    setIsTestingConnection(true);
    
    try {
      const success = await connect(values.serverUrl, values.email, values.token);
      if (success) {
        // Connection successful - the store will handle the state update
      }
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    form.resetFields();
  };

  const handleFieldChange = () => {
    // Clear any existing errors when user starts typing
    if (error) {
      clearError();
    }
  };

  const validateUrl = (_: any, value: string) => {
    if (!value) {
      return Promise.reject(new Error('Server URL is required'));
    }
    
    try {
      new URL(value);
      return Promise.resolve();
    } catch {
      return Promise.reject(new Error('Please enter a valid URL'));
    }
  };

  return (
    <Card title="JIRA Connection Setup" style={{ maxWidth: 600, margin: '0 auto' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {isConnected && userInfo ? (
          <Alert
            message={`Connected successfully as ${userInfo.displayName}`}
            description={`Server: ${serverUrl} | Email: ${userInfo.emailAddress}`}
            type="success"
            icon={<CheckCircleOutlined />}
            action={
              <Button size="small" onClick={handleDisconnect}>
                Disconnect
              </Button>
            }
          />
        ) : (
          <>
            <div>
              <Title level={4}>Connect to JIRA Server</Title>
              <Text type="secondary">
                Enter your JIRA server details and Personal Access Token (PAT) to connect.
                <br />
                <Link 
                  href="https://confluence.atlassian.com/enterprise/using-personal-access-tokens-1026032365.html" 
                  target="_blank"
                >
                  Learn how to create a PAT
                </Link>
              </Text>
            </div>

            {error && (
              <Alert
                message="Connection Failed"
                description={error}
                type="error"
                closable
                onClose={clearError}
              />
            )}

            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              onChange={handleFieldChange}
              autoComplete="off"
            >
              <Form.Item
                name="serverUrl"
                label="JIRA Server URL"
                rules={[
                  { required: true, message: 'Please enter your JIRA server URL' },
                  { validator: validateUrl },
                ]}
              >
                <Input
                  prefix={<LinkOutlined />}
                  placeholder="https://your-jira-server.com"
                  size="large"
                  autoComplete="url"
                />
              </Form.Item>

              <Form.Item
                name="email"
                label="Email Address"
                rules={[
                  { required: true, message: 'Please enter your email address' },
                  { type: 'email', message: 'Please enter a valid email address' },
                ]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="your.email@company.com"
                  size="large"
                  autoComplete="email"
                />
              </Form.Item>

              <Form.Item
                name="token"
                label={
                  <Space>
                    <span>Personal Access Token</span>
                    <Tooltip title="Your PAT will be stored securely in your browser session only">
                      <Text type="secondary">(PAT)</Text>
                    </Tooltip>
                  </Space>
                }
                rules={[
                  { required: true, message: 'Please enter your Personal Access Token' },
                  { min: 10, message: 'Token appears to be too short' },
                ]}
              >
                <Input.Password
                  prefix={<KeyOutlined />}
                  placeholder="Your Personal Access Token"
                  size="large"
                  autoComplete="current-password"
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={isLoading || isTestingConnection}
                  size="large"
                  block
                >
                  {isTestingConnection ? 'Testing Connection...' : 'Connect to JIRA'}
                </Button>
              </Form.Item>
            </Form>
          </>
        )}

        <div>
          <Title level={5}>Security Notice</Title>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Your credentials are stored securely in your browser session and never sent to any external servers except your JIRA instance.
            This application runs entirely in your browser with no backend services.
          </Text>
        </div>
      </Space>
    </Card>
  );
};
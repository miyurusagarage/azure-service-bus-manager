import React, { useState } from "react";
import { Layout, Tree, Modal, Input, Button, Spin, Alert, Empty } from "antd";
import {
  FolderOutlined,
  MessageOutlined,
  BellOutlined,
  DisconnectOutlined,
  ApiOutlined,
} from "@ant-design/icons";
import type { DataNode } from "antd/es/tree";

const { Header, Sider, Content } = Layout;

interface NamespaceInfo {
  name: string;
  endpoint: string;
  queues: string[];
  topics: string[];
}

interface ServiceBusError {
  message: string;
  details?: string;
}

interface TreeItem {
  title: string;
  key: string;
  icon: React.ReactNode;
  children?: TreeItem[];
}

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [namespaceInfo, setNamespaceInfo] = useState<NamespaceInfo | null>(null);
  const [error, setError] = useState<ServiceBusError | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [connectionString, setConnectionString] = useState("");
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const handleConnect = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await window.electronAPI.connectServiceBus(connectionString);

      if (!result.success || !result.data) {
        let errorData: ServiceBusError;
        try {
          errorData = result.error ? JSON.parse(result.error) : { message: "Failed to connect" };
        } catch (e) {
          errorData = {
            message: "Failed to connect",
            details: result.error,
          };
        }
        throw new Error(JSON.stringify(errorData));
      }

      const { name, endpoint } = result.data;

      // Get queues and topics
      const queuesResult = await window.electronAPI.listQueues();
      const topicsResult = await window.electronAPI.listTopics();

      if (!queuesResult.success || !topicsResult.success) {
        let errorData: ServiceBusError;
        try {
          errorData = queuesResult.error
            ? JSON.parse(queuesResult.error)
            : topicsResult.error
              ? JSON.parse(topicsResult.error)
              : { message: "Failed to fetch queues and topics" };
        } catch (e) {
          errorData = {
            message: "Failed to fetch queues and topics",
            details: queuesResult.error || topicsResult.error,
          };
        }
        throw new Error(JSON.stringify(errorData));
      }

      setNamespaceInfo({
        name,
        endpoint,
        queues: queuesResult.data || [],
        topics: topicsResult.data || [],
      });

      setIsConnected(true);
      setShowConnectionModal(false);
      setConnectionString("");
    } catch (error) {
      console.error("Failed to connect:", error);
      let errorData: ServiceBusError;
      try {
        errorData = JSON.parse(
          error instanceof Error ? error.message : '{"message": "An unexpected error occurred"}'
        );
      } catch (e) {
        errorData = {
          message: "An unexpected error occurred",
          details: error instanceof Error ? error.message : String(error),
        };
      }
      setError(errorData);
      setIsConnected(false);
      setNamespaceInfo(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await window.electronAPI.disconnectServiceBus();
      setIsConnected(false);
      setNamespaceInfo(null);
      setError(null);
      setSelectedNode(null);
    } catch (error) {
      console.error("Failed to disconnect:", error);
    }
  };

  const getTreeData = (): TreeItem[] => {
    if (!namespaceInfo) return [];

    return [
      {
        title: "Queues",
        key: "queues",
        icon: <FolderOutlined />,
        children: namespaceInfo.queues.map((queue) => ({
          title: queue,
          key: `queue-${queue}`,
          icon: <MessageOutlined />,
        })),
      },
      {
        title: "Topics",
        key: "topics",
        icon: <FolderOutlined />,
        children: namespaceInfo.topics.map((topic) => ({
          title: topic,
          key: `topic-${topic}`,
          icon: <BellOutlined />,
        })),
      },
    ];
  };

  if (!isConnected) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <ApiOutlined className="text-5xl text-blue-600 mb-4" />
          <h1 className="text-2xl font-semibold mb-4">Azure Service Bus Manager</h1>
          <Button
            type="primary"
            size="large"
            onClick={() => setShowConnectionModal(true)}
            loading={isLoading}
          >
            Connect to Service Bus
          </Button>
        </div>

        <Modal
          title="Connect to Service Bus"
          open={showConnectionModal}
          onCancel={() => {
            setShowConnectionModal(false);
            setError(null);
          }}
          footer={[
            <Button
              key="cancel"
              onClick={() => {
                setShowConnectionModal(false);
                setError(null);
              }}
            >
              Cancel
            </Button>,
            <Button
              key="connect"
              type="primary"
              loading={isLoading}
              disabled={!connectionString}
              onClick={handleConnect}
            >
              Connect
            </Button>,
          ]}
        >
          {error && (
            <Alert
              message={error.message}
              description={
                error.details && (
                  <pre className="mt-2 text-xs whitespace-pre-wrap font-mono">{error.details}</pre>
                )
              }
              type="error"
              showIcon
              className="mb-4"
            />
          )}
          <Input.TextArea
            placeholder="Enter your connection string"
            value={connectionString}
            onChange={(e) => setConnectionString(e.target.value)}
            rows={3}
          />
        </Modal>
      </div>
    );
  }

  return (
    <Layout className="h-screen">
      <Header className="bg-white border-b border-gray-200 px-4 flex items-center justify-between">
        <div className="flex items-center">
          <ApiOutlined className="text-2xl text-blue-600 mr-3" />
          <h1 className="text-xl font-semibold m-0">Azure Service Bus Manager</h1>
        </div>
        <Button
          icon={<DisconnectOutlined />}
          onClick={handleDisconnect}
          className="hover:text-red-600"
        >
          Disconnect
        </Button>
      </Header>
      <Layout>
        <Sider width={300} className="bg-white border-r border-gray-200 p-4">
          <div className="mb-4">
            <div className="text-sm text-gray-500">Namespace</div>
            <div className="font-medium">{namespaceInfo?.name}</div>
          </div>
          <Tree
            treeData={getTreeData()}
            selectedKeys={selectedNode ? [selectedNode] : []}
            onSelect={(selectedKeys) => {
              const selected = selectedKeys[0]?.toString();
              setSelectedNode(selected || null);
            }}
          />
        </Sider>
        <Content className="bg-gray-50 p-6">
          {selectedNode ? (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-4">
                {selectedNode.startsWith("queue-")
                  ? `Queue: ${selectedNode.replace("queue-", "")}`
                  : `Topic: ${selectedNode.replace("topic-", "")}`}
              </h2>
              {/* Message viewer will go here */}
              <Empty description="Message viewer coming soon" />
            </div>
          ) : (
            <Empty description="Select a queue or topic to view messages" />
          )}
        </Content>
      </Layout>
    </Layout>
  );
}

export default App;

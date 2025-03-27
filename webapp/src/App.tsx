import React, { useState, useEffect } from "react";
import { Layout, Tree, Modal, Input, Button, Spin, Alert, Empty, Table, Tabs } from "antd";
import {
  FolderOutlined,
  MessageOutlined,
  BellOutlined,
  DisconnectOutlined,
  ApiOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import type { DataNode } from "antd/es/tree";

const { Header, Sider, Content } = Layout;

interface NamespaceInfo {
  name: string;
  endpoint: string;
  queues: QueueInfo[];
  topics: string[];
}

interface ServiceBusError {
  message: string;
  details?: string;
}

interface TreeItem {
  title: React.ReactNode;
  key: string;
  icon?: React.ReactNode;
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
  const [siderWidth, setSiderWidth] = useState(300);
  const [isResizing, setIsResizing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [messages, setMessages] = useState<ServiceBusMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [dlqMessages, setDlqMessages] = useState<ServiceBusMessage[]>([]);
  const [isLoadingDlqMessages, setIsLoadingDlqMessages] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<ServiceBusMessage | null>(null);
  const resizeStartX = React.useRef<number>(0);
  const initialWidth = React.useRef<number>(0);
  const [lastConnectionString, setLastConnectionString] = useState("");
  const [resendingMessage, setResendingMessage] = useState<{ [key: string]: boolean }>({});

  const handleResendMessage = async (message: ServiceBusMessage, queueName: string) => {
    const messageKey = message.messageId || message.sequenceNumber?.toString() || "";
    try {
      setResendingMessage((prev) => ({ ...prev, [messageKey]: true }));
      const cleanQueueName = queueName.replace(/^queue-/, "");

      const result = await window.electronAPI.sendMessage(cleanQueueName, message);
      if (!result.success) {
        throw new Error(result.error || "Failed to send message");
      }

      // Refresh the messages after successful resend
      await handlePeekMessages(cleanQueueName);
    } catch (error) {
      console.error("Failed to resend message:", error);
      // You might want to show an error notification here
    } finally {
      setResendingMessage((prev) => ({ ...prev, [messageKey]: false }));
    }
  };

  const handlePeekMessages = async (queueName: string) => {
    try {
      setIsLoadingMessages(true);
      console.log("Peeking messages for queue:", queueName);

      // Ensure we're using the exact queue name without any extra processing
      const cleanQueueName = queueName.replace(/^queue-/, "");
      console.log("Clean queue name:", cleanQueueName);

      // Always peek from the beginning (sequence number 0)
      const result = await window.electronAPI.peekQueueMessages(cleanQueueName, 10, 0);
      console.log("Peek result:", result);

      if (!result.success) {
        // If the peek failed, try to reconnect once and retry
        if (result.error?.includes("connection") && lastConnectionString) {
          console.log("Connection might be stale, attempting to reconnect...");
          await window.electronAPI.connectServiceBus(lastConnectionString);
          console.log("Retrying peek after reconnection...");
          const retryResult = await window.electronAPI.peekQueueMessages(cleanQueueName, 10, 0);
          if (!retryResult.success) {
            throw new Error(retryResult.error || "Failed to peek messages after reconnection");
          }
          if (retryResult.data) {
            console.log("Retry successful, messages received:", retryResult.data.length);
            setMessages(retryResult.data);
            return;
          }
        }
        throw new Error(result.error || "Failed to peek messages");
      }

      if (!result.data) {
        console.log("No messages returned");
        setMessages([]);
        return;
      }

      console.log("Messages received:", result.data.length);
      setMessages(result.data);
    } catch (error) {
      console.error("Failed to peek messages:", error);
      setMessages([]);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handlePeekDlqMessages = async (queueName: string) => {
    try {
      setIsLoadingDlqMessages(true);
      console.log("Peeking DLQ messages for queue:", queueName);

      const cleanQueueName = queueName.replace(/^queue-/, "");
      console.log("Clean queue name:", cleanQueueName);

      const result = await window.electronAPI.peekQueueDeadLetterMessages(cleanQueueName, 10);
      console.log("DLQ Peek result:", result);

      if (!result.success) {
        throw new Error(result.error || "Failed to peek DLQ messages");
      }

      if (!result.data) {
        console.log("No DLQ messages returned");
        setDlqMessages([]);
        return;
      }

      console.log("DLQ Messages received:", result.data.length);
      setDlqMessages(result.data);
    } catch (error) {
      console.error("Failed to peek DLQ messages:", error);
      setDlqMessages([]);
    } finally {
      setIsLoadingDlqMessages(false);
    }
  };

  useEffect(() => {
    if (selectedNode?.startsWith("queue-")) {
      const queueName = selectedNode.replace("queue-", "");
      handlePeekMessages(queueName);
      handlePeekDlqMessages(queueName);
    } else {
      setMessages([]);
      setDlqMessages([]);
    }
  }, [selectedNode]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const deltaX = e.clientX - resizeStartX.current;
      const newWidth = Math.min(600, Math.max(200, initialWidth.current + deltaX));
      setSiderWidth(newWidth);

      // Prevent text selection during resize
      e.preventDefault();
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!isResizing) return;
      setIsResizing(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      e.preventDefault();
    };

    if (isResizing) {
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing]);

  const handleResizeStart = (e: React.MouseEvent) => {
    setIsResizing(true);
    resizeStartX.current = e.clientX;
    initialWidth.current = siderWidth;
    e.preventDefault();
  };

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

      setLastConnectionString(connectionString);
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

    const filterItems = (items: any[], isTopics: boolean = false) => {
      const searchLower = searchTerm.toLowerCase();
      return items.filter((item) =>
        isTopics
          ? item.toLowerCase().includes(searchLower)
          : item.name?.toLowerCase().includes(searchLower)
      );
    };

    const filteredQueues = filterItems(namespaceInfo.queues);
    const filteredTopics = filterItems(namespaceInfo.topics, true);

    const hasResults = filteredQueues.length > 0 || filteredTopics.length > 0;
    const showAll = searchTerm.length === 0;

    return [
      ...(showAll || filteredQueues.length > 0
        ? [
            {
              title: "Queues",
              key: "queues",
              children: filteredQueues.map((queue) => ({
                title: (
                  <span className="ml-[-30px] flex items-start">
                    <span className="text-gray-500 whitespace-nowrap pr-2">
                      ({queue.activeMessageCount}/{queue.messageCount})
                    </span>
                    <span className="break-words">{queue.name}</span>
                  </span>
                ),
                key: `queue-${queue.name}`,
              })),
            },
          ]
        : []),
      ...(showAll || filteredTopics.length > 0
        ? [
            {
              title: "Topics",
              key: "topics",
              children: filteredTopics.map((topic) => ({
                title: topic,
                key: `topic-${topic}`,
              })),
            },
          ]
        : []),
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
        <Sider
          width={siderWidth}
          className={`bg-white border-r border-gray-200 p-4 overflow-auto relative transition-all ${isResizing ? "select-none" : ""}`}
          style={{ minWidth: "200px", maxWidth: "600px" }}
        >
          <div className="mb-4">
            <div className="text-sm text-gray-500">Namespace</div>
            <div className="font-medium">{namespaceInfo?.name}</div>
          </div>
          <Input.Search
            placeholder="Search queues and topics..."
            className="mb-4"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            allowClear
          />
          <Tree
            showIcon={true}
            treeData={getTreeData()}
            selectedKeys={selectedNode ? [selectedNode] : []}
            onSelect={(selectedKeys) => {
              const selected = selectedKeys[0]?.toString();
              setSelectedNode(selected || null);
            }}
            className="[&_.ant-tree-treenode]:py-1 [&_.ant-tree-node-content-wrapper:hover]:!bg-gray-100 [&_.ant-tree-node-selected]:!bg-blue-100 [&_.ant-tree-indent-unit]:!w-3 [&_.ant-tree-switcher]:!w-3 [&_.ant-tree-node-content-wrapper]:ml-0"
          />
          <div
            className={`absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-gray-200 transition-colors ${isResizing ? "bg-blue-400" : "bg-transparent"}`}
            onMouseDown={handleResizeStart}
          />
        </Sider>
        <Content className="bg-gray-50 p-6">
          {selectedNode ? (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold m-0">
                  {selectedNode.startsWith("queue-")
                    ? `Queue: ${selectedNode.replace("queue-", "")}`
                    : `Topic: ${selectedNode.replace("topic-", "")}`}
                </h2>
                {selectedNode.startsWith("queue-") && (
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={() => {
                      const queueName = selectedNode.replace("queue-", "");
                      handlePeekMessages(queueName);
                      handlePeekDlqMessages(queueName);
                    }}
                    loading={isLoadingMessages || isLoadingDlqMessages}
                  >
                    Refresh
                  </Button>
                )}
              </div>
              {selectedNode.startsWith("queue-") ? (
                <Tabs
                  defaultActiveKey="messages"
                  onChange={(activeKey) => {
                    if (activeKey === "dlq" && selectedNode?.startsWith("queue-")) {
                      const queueName = selectedNode.replace("queue-", "");
                      handlePeekDlqMessages(queueName);
                    }
                  }}
                  items={[
                    {
                      key: "messages",
                      label: "Messages",
                      children: isLoadingMessages ? (
                        <div className="flex items-center justify-center py-12">
                          <Spin size="large" />
                        </div>
                      ) : messages.length > 0 ? (
                        <div className="h-[calc(100vh-280px)] overflow-auto">
                          <Table
                            dataSource={messages.map((msg, index) => ({
                              ...msg,
                              key: msg.messageId || index,
                              enqueuedTime: msg.enqueuedTime
                                ? new Date(msg.enqueuedTime).toLocaleString()
                                : undefined,
                            }))}
                            columns={[
                              {
                                title: "Seq No.",
                                dataIndex: "sequenceNumber",
                                key: "sequenceNumber",
                                width: 100,
                                render: (sequenceNumber: bigint) =>
                                  sequenceNumber?.toString() || "N/A",
                              },
                              {
                                title: "Message ID",
                                dataIndex: "messageId",
                                key: "messageId",
                                width: 220,
                              },
                              {
                                title: "Content Type",
                                dataIndex: "contentType",
                                key: "contentType",
                                width: 120,
                                render: (contentType: string) =>
                                  contentType?.replace("application/", "") || "N/A",
                              },
                              {
                                title: "Enqueued Time",
                                dataIndex: "enqueuedTime",
                                key: "enqueuedTime",
                                width: 180,
                              },
                              {
                                title: "Body",
                                dataIndex: "body",
                                key: "body",
                                render: (body) => (
                                  <Button
                                    type="link"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const message = messages.find((m) => m.body === body);
                                      if (message) {
                                        setSelectedMessage(message);
                                      }
                                    }}
                                  >
                                    View Body
                                  </Button>
                                ),
                              },
                              {
                                title: "Actions",
                                key: "actions",
                                width: 100,
                                render: (_, record) => (
                                  <Button
                                    type="link"
                                    loading={
                                      resendingMessage[
                                        record.messageId || record.sequenceNumber?.toString() || ""
                                      ]
                                    }
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleResendMessage(record, selectedNode || "");
                                    }}
                                  >
                                    Resend
                                  </Button>
                                ),
                              },
                            ]}
                            scroll={{ x: true }}
                            pagination={false}
                          />
                        </div>
                      ) : (
                        <Empty description="No messages found in queue" />
                      ),
                    },
                    {
                      key: "dlq",
                      label: "Dead Letter Queue",
                      children: isLoadingDlqMessages ? (
                        <div className="flex items-center justify-center py-12">
                          <Spin size="large" />
                        </div>
                      ) : dlqMessages.length > 0 ? (
                        <div className="h-[calc(100vh-280px)] overflow-auto">
                          <Table
                            dataSource={dlqMessages.map((msg, index) => ({
                              ...msg,
                              key: msg.messageId || index,
                              enqueuedTime: msg.enqueuedTime
                                ? new Date(msg.enqueuedTime).toLocaleString()
                                : undefined,
                            }))}
                            columns={[
                              {
                                title: "Seq No.",
                                dataIndex: "sequenceNumber",
                                key: "sequenceNumber",
                                width: 100,
                                render: (sequenceNumber: bigint) =>
                                  sequenceNumber?.toString() || "N/A",
                              },
                              {
                                title: "Message ID",
                                dataIndex: "messageId",
                                key: "messageId",
                                width: 220,
                              },
                              {
                                title: "Content Type",
                                dataIndex: "contentType",
                                key: "contentType",
                                width: 120,
                                render: (contentType: string) =>
                                  contentType?.replace("application/", "") || "N/A",
                              },
                              {
                                title: "Enqueued Time",
                                dataIndex: "enqueuedTime",
                                key: "enqueuedTime",
                                width: 180,
                              },
                              {
                                title: "Body",
                                dataIndex: "body",
                                key: "body",
                                render: (body) => (
                                  <Button
                                    type="link"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const message = dlqMessages.find((m) => m.body === body);
                                      if (message) {
                                        setSelectedMessage(message);
                                      }
                                    }}
                                  >
                                    View Body
                                  </Button>
                                ),
                              },
                              {
                                title: "Actions",
                                key: "actions",
                                width: 100,
                                render: (_, record) => (
                                  <Button
                                    type="link"
                                    loading={
                                      resendingMessage[
                                        record.messageId || record.sequenceNumber?.toString() || ""
                                      ]
                                    }
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleResendMessage(record, selectedNode || "");
                                    }}
                                  >
                                    Resend
                                  </Button>
                                ),
                              },
                            ]}
                            scroll={{ x: true }}
                            pagination={false}
                          />
                        </div>
                      ) : (
                        <Empty description="No messages found in dead letter queue" />
                      ),
                    },
                  ]}
                />
              ) : (
                <Empty description="Topic message viewer coming soon" />
              )}
            </div>
          ) : (
            <Empty description="Select a queue or topic to view messages" />
          )}
        </Content>
      </Layout>
      <Modal
        title={`Message Details - ${selectedMessage?.messageId || "Unknown ID"}`}
        open={selectedMessage !== null}
        onCancel={() => setSelectedMessage(null)}
        width={800}
        footer={[
          <Button
            key="copy"
            onClick={() => {
              if (selectedMessage?.body) {
                const text =
                  typeof selectedMessage.body === "object"
                    ? JSON.stringify(selectedMessage.body, null, 2)
                    : String(selectedMessage.body);
                navigator.clipboard.writeText(text);
              }
            }}
          >
            Copy to Clipboard
          </Button>,
          <Button key="close" type="primary" onClick={() => setSelectedMessage(null)}>
            Close
          </Button>,
        ]}
      >
        <div className="space-y-4">
          <div>
            <div className="font-medium text-gray-500 mb-1">Message Properties</div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500">Content Type</div>
                <div>{selectedMessage?.contentType?.replace("application/", "") || "N/A"}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Correlation ID</div>
                <div>{selectedMessage?.correlationId || "N/A"}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Subject</div>
                <div>{selectedMessage?.subject || "N/A"}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Session ID</div>
                <div>{selectedMessage?.sessionId || "N/A"}</div>
              </div>
            </div>
          </div>
          <div>
            <div className="font-medium text-gray-500 mb-1">Message Body</div>
            <pre className="bg-gray-50 p-4 rounded-lg overflow-auto max-h-96 whitespace-pre-wrap font-mono text-sm">
              {typeof selectedMessage?.body === "object"
                ? JSON.stringify(selectedMessage.body, null, 2)
                : selectedMessage?.body}
            </pre>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}

export default App;

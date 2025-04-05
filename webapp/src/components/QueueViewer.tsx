import React, { useEffect, useState } from "react";
import { Button, Tabs, message as antMessage, Switch, Card, Input } from "antd";
import { ReloadOutlined, PlusOutlined } from "@ant-design/icons";
import { useServiceBus } from "../hooks/useServiceBus";
import { SendMessageModal } from "./SendMessageModal";
import { MessageTable } from "./MessageTable";
import { useMessageFilter } from "../hooks/useMessageFilter";
import { useServiceBusStore } from "../stores/serviceBusStore";
import type { ServiceBusMessage } from "../types/serviceBus";

interface QueueViewerProps {
  selectedNode: string | null;
}

export const QueueViewer: React.FC<QueueViewerProps> = ({ selectedNode }) => {
  const {
    messages,
    dlqMessages,
    isLoadingMessages,
    isLoadingDlqMessages,
    deletingMessage,
    resendingMessage,
    handlePeekMessages,
    handlePeekDlqMessages,
    handleDeleteMessage,
    handleResendMessage,
    handleSendMessage,
    viewMode,
    setViewMode,
  } = useServiceBus();

  const setSelectedMessage = useServiceBusStore((state) => state.setSelectedMessage);

  const [activeTab, setActiveTab] = useState<"active" | "dlq">("active");
  const [sendMessageModalVisible, setSendMessageModalVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const queueName = selectedNode?.replace("queue-", "") || "";
  const filteredMessages = useMessageFilter(messages, searchTerm);
  const filteredDlqMessages = useMessageFilter(dlqMessages, searchTerm);

  useEffect(() => {
    if (queueName) {
      handlePeekMessages(queueName, pagination.pageSize);
    }
  }, [queueName, pagination.pageSize]);

  const handleTabChange = (key: string) => {
    setActiveTab(key as "active" | "dlq");
    if (key === "dlq") {
      handlePeekDlqMessages(queueName, pagination.pageSize);
    } else {
      handlePeekMessages(queueName, pagination.pageSize);
    }
  };

  const handlePaginationChange = (page: number, pageSize: number) => {
    setPagination((prev) => ({
      ...prev,
      current: page,
      pageSize: pageSize || prev.pageSize,
      total: activeTab === "active" ? filteredMessages.length : filteredDlqMessages.length,
    }));
  };

  const handleSend = (message: ServiceBusMessage) => {
    return handleSendMessage(message, queueName);
  };

  if (!selectedNode) {
    return null;
  }

  const displayName = selectedNode.replace("queue-", "");

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <div className="mb-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold">Queue: {displayName}</h2>
            <div className="flex items-center gap-2">
              <Switch
                checked={viewMode === "receive"}
                onChange={(checked) => setViewMode(checked ? "receive" : "peek")}
                checkedChildren="Receive"
                unCheckedChildren="Peek"
              />
            </div>
          </div>
          <div className="flex space-x-2">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setSendMessageModalVisible(true)}
            >
              Send Message
            </Button>
            <Button
              type="default"
              icon={<ReloadOutlined />}
              onClick={() => {
                if (activeTab === "dlq") {
                  handlePeekDlqMessages(queueName, pagination.pageSize);
                } else {
                  handlePeekMessages(queueName, pagination.pageSize);
                }
              }}
              loading={activeTab === "dlq" ? isLoadingDlqMessages : isLoadingMessages}
            >
              Refresh
            </Button>
          </div>
        </div>
        <Input.Search
          placeholder="Search in message body..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
          allowClear
        />
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        className="flex-1 min-h-0 flex flex-col"
        items={[
          {
            key: "active",
            label: "Active Messages",
            children: (
              <div className="flex-1 min-h-0 flex flex-col">
                <div className="flex-1 min-h-0">
                  <MessageTable
                    messages={filteredMessages}
                    onViewMessage={(message) => setSelectedMessage(message)}
                    onDeleteMessage={handleDeleteMessage}
                    deletingMessage={deletingMessage}
                    queueName={queueName}
                    pagination={{
                      ...pagination,
                      total: filteredMessages.length,
                    }}
                    onPaginationChange={handlePaginationChange}
                  />
                </div>
              </div>
            ),
          },
          {
            key: "dlq",
            label: "Dead Letter Queue",
            children: (
              <div className="flex-1 min-h-0 flex flex-col">
                <div className="flex-1 min-h-0">
                  <MessageTable
                    messages={filteredDlqMessages}
                    onViewMessage={(message) => setSelectedMessage(message)}
                    onDeleteMessage={handleDeleteMessage}
                    onResendMessage={handleResendMessage}
                    deletingMessage={deletingMessage}
                    resendingMessage={resendingMessage}
                    queueName={queueName}
                    isDlq={true}
                    pagination={{
                      ...pagination,
                      total: filteredDlqMessages.length,
                    }}
                    onPaginationChange={handlePaginationChange}
                  />
                </div>
              </div>
            ),
          },
        ]}
      />

      <SendMessageModal
        visible={sendMessageModalVisible}
        onClose={() => setSendMessageModalVisible(false)}
        onSend={handleSend}
        queueName={queueName}
      />
    </Card>
  );
};

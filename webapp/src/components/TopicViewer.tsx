import React, { useEffect, useState } from "react";
import { Card, Tabs, Spin, Empty, Select, Button, Switch } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import { useServiceBus } from "../hooks/useServiceBus";
import { MessageTable } from "./MessageTable";
import { useMessageFilter } from "../hooks/useMessageFilter";
import { useServiceBusStore } from "../stores/serviceBusStore";
import type { ServiceBusMessage } from "../types/serviceBus";

interface TopicViewerProps {
  selectedNode: string | null;
}

export const TopicViewer: React.FC<TopicViewerProps> = ({ selectedNode }) => {
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
    viewMode,
    setViewMode,
  } = useServiceBus();

  const setSelectedMessage = useServiceBusStore((state) => state.setSelectedMessage);
  const [subscriptions, setSubscriptions] = useState<string[]>([]);
  const [selectedSubscription, setSelectedSubscription] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"active" | "dlq">("active");
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const topicName = selectedNode?.replace("topic-", "") || "";
  const filteredMessages = useMessageFilter(messages, searchTerm);
  const filteredDlqMessages = useMessageFilter(dlqMessages, searchTerm);

  useEffect(() => {
    if (topicName) {
      // Fetch subscriptions for the topic
      window.electronAPI.listSubscriptions(topicName).then((result) => {
        if (result.success && result.data) {
          setSubscriptions(result.data);
          if (result.data.length > 0) {
            setSelectedSubscription(result.data[0]);
          }
        }
      });
    }
  }, [topicName]);

  useEffect(() => {
    if (topicName && selectedSubscription) {
      const subscriptionPath = `${topicName}/Subscriptions/${selectedSubscription}`;
      if (activeTab === "dlq") {
        handlePeekDlqMessages(subscriptionPath, pagination.pageSize);
      } else {
        handlePeekMessages(subscriptionPath, pagination.pageSize);
      }
    }
  }, [topicName, selectedSubscription, activeTab, pagination.pageSize]);

  const handleTabChange = (key: string) => {
    setActiveTab(key as "active" | "dlq");
  };

  const handlePaginationChange = (page: number, pageSize: number) => {
    setPagination((prev) => ({
      ...prev,
      current: page,
      pageSize: pageSize || prev.pageSize,
      total: activeTab === "active" ? filteredMessages.length : filteredDlqMessages.length,
    }));
  };

  const handleRefresh = () => {
    if (!topicName || !selectedSubscription) return;
    const subscriptionPath = `${topicName}/Subscriptions/${selectedSubscription}`;
    if (activeTab === "dlq") {
      handlePeekDlqMessages(subscriptionPath, pagination.pageSize);
    } else {
      handlePeekMessages(subscriptionPath, pagination.pageSize);
    }
  };

  if (!selectedNode) {
    return null;
  }

  const displayName = selectedNode.replace("topic-", "");

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <div className="mb-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold">Topic: {displayName}</h2>
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
              type="default"
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              loading={activeTab === "dlq" ? isLoadingDlqMessages : isLoadingMessages}
            >
              Refresh
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-64">
            <div className="text-sm text-gray-500 mb-1">Subscription</div>
            <Select
              className="w-full"
              placeholder="Select subscription"
              value={selectedSubscription}
              onChange={setSelectedSubscription}
              options={subscriptions.map((sub) => ({ label: sub, value: sub }))}
            />
          </div>
        </div>
      </div>

      {selectedSubscription ? (
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          className="flex-1 min-h-0 flex flex-col overflow-hidden"
          items={[
            {
              key: "active",
              label: "Active Messages",
              children: (
                <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                  <div className="flex-1 min-h-0 overflow-hidden">
                    <MessageTable
                      messages={filteredMessages}
                      onViewMessage={(message) => setSelectedMessage(message)}
                      onDeleteMessage={handleDeleteMessage}
                      deletingMessage={deletingMessage}
                      queueName={`${topicName}/Subscriptions/${selectedSubscription}`}
                      pagination={{
                        ...pagination,
                        total: filteredMessages.length,
                      }}
                      onPaginationChange={handlePaginationChange}
                      isLoading={isLoadingMessages}
                    />
                  </div>
                </div>
              ),
            },
            {
              key: "dlq",
              label: "Dead Letter Queue",
              children: (
                <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                  <div className="flex-1 min-h-0 overflow-hidden">
                    <MessageTable
                      messages={filteredDlqMessages}
                      onViewMessage={(message) => setSelectedMessage(message)}
                      onDeleteMessage={handleDeleteMessage}
                      onResendMessage={handleResendMessage}
                      deletingMessage={deletingMessage}
                      resendingMessage={resendingMessage}
                      queueName={`${topicName}/Subscriptions/${selectedSubscription}`}
                      isDlq={true}
                      pagination={{
                        ...pagination,
                        total: filteredDlqMessages.length,
                      }}
                      onPaginationChange={handlePaginationChange}
                      isLoading={isLoadingDlqMessages}
                    />
                  </div>
                </div>
              ),
            },
          ]}
        />
      ) : (
        <Empty description="No subscription selected" />
      )}
    </Card>
  );
};

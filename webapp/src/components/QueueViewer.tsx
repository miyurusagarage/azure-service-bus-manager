import React, { useEffect, useState } from "react";
import { Button, Spin, Empty, Tabs, Input } from "antd";
import { ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import { MessageTable } from "./MessageTable";
import { useServiceBusStore } from "../stores/serviceBusStore";
import { useServiceBus } from "../hooks/useServiceBus";

export const QueueViewer: React.FC = () => {
  const {
    selectedNode,
    messages,
    dlqMessages,
    isLoadingMessages,
    isLoadingDlqMessages,
    resendingMessage,
    selectedMessage,
    setSelectedMessage,
  } = useServiceBusStore();

  const [searchTerm, setSearchTerm] = useState("");
  const { handlePeekMessages, handlePeekDlqMessages, handleResendMessage } = useServiceBus();

  useEffect(() => {
    if (selectedNode?.startsWith("queue-")) {
      const queueName = selectedNode.replace("queue-", "");
      handlePeekMessages(queueName);
      handlePeekDlqMessages(queueName);
    }
  }, [selectedNode]);

  if (!selectedNode) {
    return <Empty description="Select a queue or topic to view messages" />;
  }

  const isQueue = selectedNode.startsWith("queue-");
  const displayName = selectedNode.replace(isQueue ? "queue-" : "topic-", "");

  const handleRefresh = () => {
    if (selectedNode.startsWith("queue-")) {
      const queueName = selectedNode.replace("queue-", "");
      handlePeekMessages(queueName);
      handlePeekDlqMessages(queueName);
    }
  };

  const handleDlqTabChange = () => {
    if (selectedNode.startsWith("queue-")) {
      const queueName = selectedNode.replace("queue-", "");
      handlePeekDlqMessages(queueName);
    }
  };

  const filterMessages = (messages: any[]) => {
    if (!searchTerm) return messages;
    const term = searchTerm.toLowerCase();
    return messages.filter((msg) => {
      const body = typeof msg.body === "string" ? msg.body : JSON.stringify(msg.body);
      return body.toLowerCase().includes(term);
    });
  };

  const filteredMessages = filterMessages(messages);
  const filteredDlqMessages = filterMessages(dlqMessages);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold m-0">
          {isQueue ? `Queue: ${displayName}` : `Topic: ${displayName}`}
        </h2>
        {isQueue && (
          <Button
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            loading={isLoadingMessages || isLoadingDlqMessages}
          >
            Refresh
          </Button>
        )}
      </div>
      {isQueue ? (
        <Tabs
          defaultActiveKey="messages"
          onChange={(activeKey) => {
            if (activeKey === "dlq") {
              handleDlqTabChange();
            }
          }}
          items={[
            {
              key: "messages",
              label: "Messages",
              children: (
                <>
                  <div className="mb-4">
                    <Input.Search
                      placeholder="Search in message body..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full"
                      allowClear
                    />
                  </div>
                  {isLoadingMessages ? (
                    <div className="flex items-center justify-center py-12">
                      <Spin size="large" />
                    </div>
                  ) : filteredMessages.length > 0 ? (
                    <MessageTable
                      messages={filteredMessages}
                      onViewMessage={setSelectedMessage}
                      onResendMessage={handleResendMessage}
                      resendingMessage={resendingMessage}
                      queueName={selectedNode}
                    />
                  ) : (
                    <Empty
                      description={
                        searchTerm ? "No messages match your search" : "No messages found in queue"
                      }
                    />
                  )}
                </>
              ),
            },
            {
              key: "dlq",
              label: "Dead Letter Queue",
              children: (
                <>
                  <div className="mb-4">
                    <Input.Search
                      placeholder="Search in message body..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full"
                      allowClear
                    />
                  </div>
                  {isLoadingDlqMessages ? (
                    <div className="flex items-center justify-center py-12">
                      <Spin size="large" />
                    </div>
                  ) : filteredDlqMessages.length > 0 ? (
                    <MessageTable
                      messages={filteredDlqMessages}
                      onViewMessage={setSelectedMessage}
                      onResendMessage={handleResendMessage}
                      resendingMessage={resendingMessage}
                      queueName={selectedNode}
                    />
                  ) : (
                    <Empty
                      description={
                        searchTerm
                          ? "No messages match your search"
                          : "No messages found in dead letter queue"
                      }
                    />
                  )}
                </>
              ),
            },
          ]}
        />
      ) : (
        <Empty description="Topic message viewer coming soon" />
      )}
    </div>
  );
};

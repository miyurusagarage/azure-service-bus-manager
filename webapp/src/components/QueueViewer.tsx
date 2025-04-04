import React, { useEffect, useState } from "react";
import { Button, Tabs, Empty, Switch } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import { useServiceBusStore } from "../stores/serviceBusStore";
import { useServiceBus } from "../hooks/useServiceBus";
import { MessageSearch } from "./MessageSearch";
import { MessageList } from "./MessageList";
import { useMessageFilter } from "../hooks/useMessageFilter";

export const QueueViewer: React.FC = () => {
  const {
    selectedNode,
    messages,
    dlqMessages,
    isLoadingMessages,
    isLoadingDlqMessages,
    deletingMessage,
    resendingMessage,
    selectedMessage,
    setSelectedMessage,
    viewMode,
    setViewMode,
  } = useServiceBusStore();

  const [searchTerm, setSearchTerm] = useState("");
  const { handlePeekMessages, handlePeekDlqMessages, handleDeleteMessage, handleResendMessage } =
    useServiceBus();

  const filteredMessages = useMessageFilter(messages, searchTerm);
  const filteredDlqMessages = useMessageFilter(dlqMessages, searchTerm);

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

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold m-0">
            {isQueue ? `Queue: ${displayName}` : `Topic: ${displayName}`}
          </h2>
          <div className="flex items-center gap-2">
            <Switch
              checked={viewMode === "receive"}
              onChange={(checked) => setViewMode(checked ? "receive" : "peek")}
              checkedChildren="Receive"
              unCheckedChildren="Peek"
            />
          </div>
        </div>
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
            if (selectedNode?.startsWith("queue-")) {
              const queueName = selectedNode.replace("queue-", "");
              if (activeKey === "dlq") {
                handlePeekDlqMessages(queueName);
              } else {
                handlePeekMessages(queueName);
              }
            }
          }}
          items={[
            {
              key: "messages",
              label: "Messages",
              children: (
                <>
                  <MessageSearch searchTerm={searchTerm} onSearchChange={setSearchTerm} />
                  <MessageList
                    messages={filteredMessages}
                    isLoading={isLoadingMessages}
                    searchTerm={searchTerm}
                    onViewMessage={setSelectedMessage}
                    onDeleteMessage={handleDeleteMessage}
                    deletingMessage={deletingMessage}
                    queueName={selectedNode}
                    emptyMessage={
                      searchTerm ? "No messages match your search" : "No messages found in queue"
                    }
                  />
                </>
              ),
            },
            {
              key: "dlq",
              label: "Dead Letter Queue",
              children: (
                <>
                  <MessageSearch searchTerm={searchTerm} onSearchChange={setSearchTerm} />
                  <MessageList
                    messages={filteredDlqMessages}
                    isLoading={isLoadingDlqMessages}
                    searchTerm={searchTerm}
                    onViewMessage={setSelectedMessage}
                    onDeleteMessage={handleDeleteMessage}
                    onResendMessage={handleResendMessage}
                    deletingMessage={deletingMessage}
                    resendingMessage={resendingMessage}
                    queueName={selectedNode}
                    emptyMessage={
                      searchTerm
                        ? "No messages match your search"
                        : "No messages found in dead letter queue"
                    }
                    isDlq={true}
                  />
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

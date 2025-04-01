import React from "react";
import { Spin, Empty } from "antd";
import { MessageTable } from "./MessageTable";
import type { ServiceBusMessage } from "../types/serviceBus";

interface MessageListProps {
  messages: ServiceBusMessage[];
  isLoading: boolean;
  searchTerm: string;
  onViewMessage: (message: ServiceBusMessage) => void;
  onResendMessage: (message: ServiceBusMessage, queueName: string) => Promise<void>;
  resendingMessage: { [key: string]: boolean };
  queueName: string;
  emptyMessage: string;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  isLoading,
  searchTerm,
  onViewMessage,
  onResendMessage,
  resendingMessage,
  queueName,
  emptyMessage,
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spin size="large" />
      </div>
    );
  }

  if (messages.length === 0) {
    return <Empty description={emptyMessage} />;
  }

  return (
    <MessageTable
      messages={messages}
      onViewMessage={onViewMessage}
      onResendMessage={onResendMessage}
      resendingMessage={resendingMessage}
      queueName={queueName}
    />
  );
};

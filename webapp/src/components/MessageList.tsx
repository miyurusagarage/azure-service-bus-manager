import React from "react";
import { Spin, Empty } from "antd";
import { MessageTable } from "./MessageTable";
import type { ServiceBusMessage } from "../types/serviceBus";

interface MessageListProps {
  messages: ServiceBusMessage[];
  isLoading: boolean;
  searchTerm: string;
  onViewMessage: (message: ServiceBusMessage) => void;
  onDeleteMessage: (message: ServiceBusMessage, queueName: string) => Promise<void>;
  onResendMessage?: (message: ServiceBusMessage, queueName: string) => Promise<void>;
  deletingMessage: { [key: string]: boolean };
  resendingMessage?: { [key: string]: boolean };
  queueName: string;
  emptyMessage: string;
  isDlq?: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  isLoading,
  searchTerm,
  onViewMessage,
  onDeleteMessage,
  onResendMessage,
  deletingMessage,
  resendingMessage,
  queueName,
  emptyMessage,
  isDlq = false,
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
      onDeleteMessage={onDeleteMessage}
      onResendMessage={onResendMessage}
      deletingMessage={deletingMessage}
      resendingMessage={resendingMessage}
      queueName={queueName}
      isDlq={isDlq}
    />
  );
};

import React from "react";
import { Table, Button, Empty } from "antd";
import type { ServiceBusMessage } from "../types/serviceBus";

interface MessageTableProps {
  messages: ServiceBusMessage[];
  onViewMessage: (message: ServiceBusMessage) => void;
  onResendMessage: (message: ServiceBusMessage, queueName: string) => Promise<void>;
  resendingMessage: { [key: string]: boolean };
  queueName: string;
}

export const MessageTable: React.FC<MessageTableProps> = ({
  messages,
  onViewMessage,
  onResendMessage,
  resendingMessage,
  queueName,
}) => {
  const columns = [
    {
      title: "Seq No.",
      dataIndex: "sequenceNumber",
      key: "sequenceNumber",
      width: 100,
      render: (sequenceNumber: bigint) => sequenceNumber?.toString() || "N/A",
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
      render: (contentType: string) => contentType?.replace("application/", "") || "N/A",
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
      render: (body: any) => (
        <Button
          type="link"
          onClick={(e) => {
            e.stopPropagation();
            const message = messages.find((m) => m.body === body);
            if (message) {
              onViewMessage(message);
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
      render: (_: any, record: ServiceBusMessage) => (
        <Button
          type="link"
          loading={resendingMessage[record.messageId || record.sequenceNumber?.toString() || ""]}
          onClick={(e) => {
            e.stopPropagation();
            onResendMessage(record, queueName);
          }}
        >
          Resend
        </Button>
      ),
    },
  ];

  return (
    <div className="overflow-auto">
      <Table
        dataSource={messages.map((msg, index) => ({
          ...msg,
          key: msg.messageId || index,
        }))}
        columns={columns}
        scroll={{ x: true }}
        pagination={false}
      />
    </div>
  );
};

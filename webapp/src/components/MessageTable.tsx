import React from "react";
import { Table, Button, Empty } from "antd";
import { DeleteOutlined, RedoOutlined } from "@ant-design/icons";
import type { ServiceBusMessage } from "../types/serviceBus";

interface MessageTableProps {
  messages: ServiceBusMessage[];
  onViewMessage: (message: ServiceBusMessage) => void;
  onDeleteMessage: (message: ServiceBusMessage, queueName: string) => Promise<void>;
  onResendMessage?: (message: ServiceBusMessage, queueName: string) => Promise<void>;
  deletingMessage: { [key: string]: boolean };
  resendingMessage?: { [key: string]: boolean };
  queueName: string;
  isDlq?: boolean;
}

export const MessageTable: React.FC<MessageTableProps> = ({
  messages,
  onViewMessage,
  onDeleteMessage,
  onResendMessage,
  deletingMessage,
  resendingMessage = {},
  queueName,
  isDlq = false,
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
      width: 220,
      render: (enqueuedTime: Date) => {
        if (!enqueuedTime) return "N/A";
        return enqueuedTime.toLocaleString();
      },
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
      render: (_: any, record: ServiceBusMessage) => {
        const messageKey = record.messageId || record.sequenceNumber?.toString() || "";

        if (isDlq && onResendMessage) {
          return (
            <Button
              type="link"
              icon={<RedoOutlined />}
              loading={resendingMessage[messageKey]}
              onClick={(e) => {
                e.stopPropagation();
                onResendMessage(record, queueName);
              }}
            >
              Resend
            </Button>
          );
        }

        return (
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            loading={deletingMessage[messageKey]}
            onClick={(e) => {
              e.stopPropagation();
              onDeleteMessage(record, queueName);
            }}
          >
            Delete
          </Button>
        );
      },
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

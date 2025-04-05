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
  pagination: {
    current: number;
    pageSize: number;
    total: number;
  };
  onPaginationChange: (page: number, pageSize: number) => void;
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
  pagination,
  onPaginationChange,
}) => {
  const columns = [
    {
      title: "Seq No.",
      dataIndex: "sequenceNumber",
      key: "sequenceNumber",
      width: 80,
      render: (sequenceNumber: bigint) => sequenceNumber?.toString() || "N/A",
    },
    {
      title: "Message ID",
      dataIndex: "messageId",
      key: "messageId",
      width: 280,
      ellipsis: true,
    },
    {
      title: "Content Type",
      dataIndex: "contentType",
      key: "contentType",
      width: 100,
      render: (contentType: string) => contentType?.replace("application/", "") || "N/A",
    },
    {
      title: "Enqueued Time",
      dataIndex: "enqueuedTime",
      key: "enqueuedTime",
      width: 180,
      render: (enqueuedTime: Date) => {
        if (!enqueuedTime) return "N/A";
        return enqueuedTime.toLocaleString();
      },
    },
    {
      title: "Body",
      dataIndex: "body",
      key: "body",
      width: 100,
      render: (body: any, record: ServiceBusMessage) => (
        <Button
          type="link"
          onClick={(e) => {
            e.stopPropagation();
            onViewMessage(record);
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
        const messageKey =
          record.sequenceNumber?.toString() ||
          record.messageId ||
          `msg-${record.body?.toString()}-${Date.now()}`;

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
    <Table
      dataSource={messages}
      columns={columns}
      rowKey={(record) =>
        record.sequenceNumber?.toString() ||
        record.messageId ||
        `msg-${record.body?.toString()}-${Date.now()}`
      }
      pagination={{
        ...pagination,
        showSizeChanger: true,
        pageSizeOptions: ["10", "20", "50", "100"],
        onChange: onPaginationChange,
        position: ["bottomCenter"],
      }}
      loading={false}
      locale={{
        emptyText: <Empty description="No messages found" />,
      }}
      scroll={{ y: "calc(100vh - 420px)", x: "100%" }}
      size="middle"
      className="flex-1 min-h-0"
    />
  );
};

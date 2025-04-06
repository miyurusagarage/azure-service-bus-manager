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
  isLoading?: boolean;
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
  isLoading = false,
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
      width: isDlq ? 120 : 100,
      render: (_: any, record: ServiceBusMessage) => {
        const messageKey = record.sequenceNumber?.toString();
        if (!messageKey) {
          console.error("Message has no sequence number:", record);
          return null;
        }

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
    <div className="overflow-x-hidden">
      <div className="ant-spin-nested-loading">
        <div>
          <div
            className="ant-spin ant-spin-spinning"
            data-testid="loading-spinner"
            aria-busy="true"
            aria-live="polite"
          >
            <span className="ant-spin-dot-holder">
              <span className="ant-spin-dot ant-spin-dot-spin">
                <i className="ant-spin-dot-item" />
                <i className="ant-spin-dot-item" />
                <i className="ant-spin-dot-item" />
                <i className="ant-spin-dot-item" />
              </span>
            </span>
          </div>
        </div>
        <div className="ant-spin-container ant-spin-blur">
          <Table
            dataSource={messages}
            columns={columns}
            rowKey={(record) => {
              const key = record.sequenceNumber?.toString();
              if (!key) {
                console.error("Message has no sequence number:", record);
                return Math.random().toString();
              }
              return key;
            }}
            pagination={{
              ...pagination,
              showSizeChanger: true,
              pageSizeOptions: ["10", "20", "50", "100"],
              onChange: onPaginationChange,
              position: ["bottomCenter"],
            }}
            loading={isLoading}
            locale={{
              emptyText: isLoading ? null : <Empty description="No messages found" />,
            }}
            scroll={{ y: "calc(100vh - 420px)" }}
            size="middle"
            className="flex-1 min-h-0"
            tableLayout="fixed"
            style={{ width: "100%" }}
          />
        </div>
      </div>
    </div>
  );
};

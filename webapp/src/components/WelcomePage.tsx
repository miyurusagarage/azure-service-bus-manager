import React from "react";
import { Card, Typography, List, Tag } from "antd";
import {
  MessageOutlined,
  ApiOutlined,
  EyeOutlined,
  DeleteOutlined,
  SendOutlined,
  ReloadOutlined,
  BranchesOutlined,
} from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;

export const WelcomePage: React.FC = () => {
  const features = [
    {
      icon: <MessageOutlined className="text-blue-500" />,
      title: "Queue Management",
      description: "View and manage messages in your queues, including dead-letter queues.",
    },
    {
      icon: <BranchesOutlined className="text-blue-500" />,
      title: "Topic & Subscription Support",
      description: "Browse messages across topic subscriptions and manage dead-letter queues.",
    },
    {
      icon: <SendOutlined className="text-blue-500" />,
      title: "Send Messages",
      description:
        "Send new messages to queues and topics with custom properties and content types.",
    },
    {
      icon: <EyeOutlined className="text-blue-500" />,
      title: "Message Preview",
      description: "Preview message content with formatted JSON and text display.",
    },
    {
      icon: <DeleteOutlined className="text-blue-500" />,
      title: "Message Management",
      description: "Delete messages from queues and dead-letter queues.",
    },
    {
      icon: <ReloadOutlined className="text-blue-500" />,
      title: "Auto-refresh",
      description: "Automatically refresh message lists to see the latest updates.",
    },
  ];

  const whatsnew = [
    "Topic subscription support with dead-letter queue management",
    "Improved message viewing with formatted content",
    "Enhanced search capabilities across messages",
    "Peek/Receive mode toggle for message handling",
  ];

  return (
    <div className="p-6 space-y-6">
      <Card>
        <div className="space-y-6">
          <div className="space-y-2">
            <Title level={2}>Welcome to Azure Service Bus Manager</Title>
            <Paragraph className="text-gray-500">
              A desktop application for managing Azure Service Bus queues and topics. Select a queue
              or topic from the sidebar to get started.
            </Paragraph>
          </div>

          <div className="space-y-4">
            <Title level={3}>Features</Title>
            <List
              grid={{ gutter: 16, column: 3 }}
              dataSource={features}
              renderItem={(item) => (
                <List.Item>
                  <Card size="small" className="h-full">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {item.icon}
                        <Text strong>{item.title}</Text>
                      </div>
                      <Text type="secondary">{item.description}</Text>
                    </div>
                  </Card>
                </List.Item>
              )}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Title level={3} className="!mb-0">
                What's New
              </Title>
              <Tag color="green">v1.0.0</Tag>
            </div>
            <List
              dataSource={whatsnew}
              renderItem={(item) => (
                <List.Item>
                  <Text>• {item}</Text>
                </List.Item>
              )}
            />
          </div>

          <div className="space-y-4">
            <Title level={3}>Getting Started</Title>
            <div className="space-y-2">
              <Paragraph>
                1. Select a queue or topic from the sidebar to view its messages
              </Paragraph>
              <Paragraph>2. Use the search bar to filter messages by their properties</Paragraph>
              <Paragraph>3. Click on a message to view its details and properties</Paragraph>
              <Paragraph>4. Use the "Send Message" button to send new messages</Paragraph>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

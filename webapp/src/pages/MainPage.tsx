import React, { useState } from "react";
import { Layout, Modal, Form, Input, message } from "antd";
import { QueueViewer } from "../components/QueueViewer";
import { TopicViewer } from "../components/TopicViewer";
import { ResizableSider } from "../components/ResizableSider";
import { Header } from "../components/Header";
import { ConnectionPrompt } from "../components/ConnectionPrompt";
import { MessageDetailsModal } from "../components/MessageDetailsModal";
import { WelcomePage } from "../components/WelcomePage";
import { useServiceBusStore } from "../stores/serviceBusStore";

const { Content } = Layout;

type ResourceType = "queue" | "topic" | "subscription";

export const MainPage: React.FC = () => {
  const { isConnected, selectedMessage, setSelectedMessage, selectedNode } = useServiceBusStore();
  const [resourceModalVisible, setResourceModalVisible] = useState(false);
  const [resourceType, setResourceType] = useState<ResourceType | null>(null);
  const [form] = Form.useForm();

  const handleCreateResource = (type: ResourceType) => {
    setResourceType(type);
    setResourceModalVisible(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      // TODO: Implement the actual creation logic
      message.success(`${resourceType} created successfully`);
      setResourceModalVisible(false);
      form.resetFields();
    } catch (error) {
      // Form validation error
    }
  };

  const handleModalCancel = () => {
    setResourceModalVisible(false);
    form.resetFields();
  };

  if (!isConnected) {
    return <ConnectionPrompt />;
  }

  const renderViewer = () => {
    if (!selectedNode) {
      return <WelcomePage />;
    }

    if (selectedNode.startsWith("topic-")) {
      return <TopicViewer selectedNode={selectedNode} />;
    } else {
      return <QueueViewer selectedNode={selectedNode} />;
    }
  };

  return (
    <Layout className="h-screen overflow-hidden">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <ResizableSider
          onCreateQueue={() => handleCreateResource("queue")}
          onCreateTopic={() => handleCreateResource("topic")}
          onCreateSubscription={() => handleCreateResource("subscription")}
        />
        <Content className="bg-gray-50 overflow-auto flex-1">{renderViewer()}</Content>
      </div>
      <MessageDetailsModal
        visible={selectedMessage !== null}
        onClose={() => setSelectedMessage(null)}
        message={selectedMessage}
      />
      <Modal
        title={
          resourceType
            ? `Create New ${resourceType.charAt(0).toUpperCase() + resourceType.slice(1)}`
            : "Create New Resource"
        }
        open={resourceModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        okText="Create"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label={
              resourceType
                ? `${resourceType.charAt(0).toUpperCase() + resourceType.slice(1)} Name`
                : "Resource Name"
            }
            rules={[{ required: true, message: "Please enter a name" }]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

import React from "react";
import { Modal, Form, Input, Select, message } from "antd";
import { useServiceBus } from "../../hooks/useServiceBus";

interface CreateSubscriptionModalProps {
  visible: boolean;
  onCancel: () => void;
}

export const CreateSubscriptionModal: React.FC<CreateSubscriptionModalProps> = ({
  visible,
  onCancel,
}) => {
  const [form] = Form.useForm();
  const { namespaceInfo, refreshNamespaceInfo } = useServiceBus();

  const handleOk = async () => {
    try {
      const values = await form.validateFields();

      const result = await window.electronAPI.createSubscription(values.topicName, values.name);
      if (!result.success) {
        throw new Error(result.error || "Failed to create subscription");
      }

      message.success(`Subscription "${values.name}" created successfully`);
      form.resetFields();
      onCancel();
      await refreshNamespaceInfo();
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message);
      } else {
        message.error("Failed to create subscription");
      }
    }
  };

  return (
    <Modal
      title="Create New Subscription"
      open={visible}
      onOk={handleOk}
      onCancel={() => {
        form.resetFields();
        onCancel();
      }}
      okText="Create"
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="topicName"
          label="Topic"
          rules={[{ required: true, message: "Please select a topic" }]}
        >
          <Select placeholder="Select a topic">
            {namespaceInfo?.topics.map((topic) => (
              <Select.Option key={topic} value={topic}>
                {topic}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item
          name="name"
          label="Subscription Name"
          rules={[
            { required: true, message: "Please enter a subscription name" },
            {
              pattern: /^[A-Za-z0-9-._]+$/,
              message: "Subscription name can only contain letters, numbers, dots, and dashes",
            },
            { max: 50, message: "Subscription name cannot exceed 50 characters" },
          ]}
        >
          <Input placeholder="my-subscription" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

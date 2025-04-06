import React from "react";
import { Modal, Form, Input, Select } from "antd";
import { useServiceBusStore } from "../../stores/serviceBusStore";

interface CreateSubscriptionModalProps {
  visible: boolean;
  onCancel: () => void;
  onOk: (values: { name: string; topicName: string }) => Promise<void>;
}

export const CreateSubscriptionModal: React.FC<CreateSubscriptionModalProps> = ({
  visible,
  onCancel,
  onOk,
}) => {
  const [form] = Form.useForm();
  const { namespaceInfo } = useServiceBusStore();

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      await onOk(values);
      form.resetFields();
    } catch (error) {
      // Form validation error
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

import React from "react";
import { Modal, Form, Input, message } from "antd";
import { useServiceBus } from "../../hooks/useServiceBus";

interface CreateTopicModalProps {
  visible: boolean;
  onCancel: () => void;
}

export const CreateTopicModal: React.FC<CreateTopicModalProps> = ({ visible, onCancel }) => {
  const [form] = Form.useForm();
  const { refreshNamespaceInfo } = useServiceBus();

  const handleOk = async () => {
    try {
      const values = await form.validateFields();

      const result = await window.electronAPI.createTopic(values.name);
      if (!result.success) {
        throw new Error(result.error || "Failed to create topic");
      }

      message.success(`Topic "${values.name}" created successfully`);
      form.resetFields();
      onCancel();
      await refreshNamespaceInfo();
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message);
      } else {
        message.error("Failed to create topic");
      }
    }
  };

  return (
    <Modal
      title="Create New Topic"
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
          name="name"
          label="Topic Name"
          rules={[
            { required: true, message: "Please enter a topic name" },
            {
              pattern: /^[A-Za-z0-9-._]+$/,
              message: "Topic name can only contain letters, numbers, dots, and dashes",
            },
            { max: 260, message: "Topic name cannot exceed 260 characters" },
          ]}
        >
          <Input placeholder="my-topic" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

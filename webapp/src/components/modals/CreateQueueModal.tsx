import React from "react";
import { Modal, Form, Input, message } from "antd";
import { useServiceBus } from "../../hooks/useServiceBus";

interface CreateQueueModalProps {
  visible: boolean;
  onCancel: () => void;
}

export const CreateQueueModal: React.FC<CreateQueueModalProps> = ({ visible, onCancel }) => {
  const [form] = Form.useForm();
  const { refreshNamespaceInfo } = useServiceBus();

  const handleOk = async () => {
    try {
      const values = await form.validateFields();

      const result = await window.electronAPI.createQueue(values.name);
      if (!result.success) {
        throw new Error(result.error || "Failed to create queue");
      }

      message.success(`Queue "${values.name}" created successfully`);
      form.resetFields();
      onCancel();
      await refreshNamespaceInfo();
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message);
      } else {
        message.error("Failed to create queue");
      }
    }
  };

  return (
    <Modal
      title="Create New Queue"
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
          label="Queue Name"
          rules={[
            { required: true, message: "Please enter a queue name" },
            {
              pattern: /^[A-Za-z0-9-._]+$/,
              message: "Queue name can only contain letters, numbers, dots, and dashes",
            },
            { max: 260, message: "Queue name cannot exceed 260 characters" },
          ]}
        >
          <Input placeholder="my-queue" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

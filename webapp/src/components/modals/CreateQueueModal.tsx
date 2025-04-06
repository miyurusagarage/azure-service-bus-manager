import React from "react";
import { Modal, Form, Input } from "antd";

interface CreateQueueModalProps {
  visible: boolean;
  onCancel: () => void;
  onOk: (values: { name: string }) => Promise<void>;
}

export const CreateQueueModal: React.FC<CreateQueueModalProps> = ({ visible, onCancel, onOk }) => {
  const [form] = Form.useForm();

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

import React from "react";
import { Modal, Form, Input } from "antd";

interface CreateTopicModalProps {
  visible: boolean;
  onCancel: () => void;
  onOk: (values: { name: string }) => Promise<void>;
}

export const CreateTopicModal: React.FC<CreateTopicModalProps> = ({ visible, onCancel, onOk }) => {
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

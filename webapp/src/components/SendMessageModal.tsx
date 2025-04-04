import React, { useState } from "react";
import { Modal, Form, Input, Button, Select } from "antd";
import type { ServiceBusMessage } from "../types/serviceBus";

const { TextArea } = Input;

interface SendMessageModalProps {
  visible: boolean;
  onClose: () => void;
  onSend: (message: ServiceBusMessage) => Promise<void>;
  queueName: string;
}

export const SendMessageModal: React.FC<SendMessageModalProps> = ({
  visible,
  onClose,
  onSend,
  queueName,
}) => {
  const [form] = Form.useForm();
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSending(true);

      let body: any;
      try {
        body = JSON.parse(values.body);
      } catch (e) {
        // If not valid JSON, use as string
        body = values.body;
      }

      const message: ServiceBusMessage = {
        messageId: values.messageId,
        body,
        contentType: values.contentType || "application/json",
        correlationId: values.correlationId,
        subject: values.subject,
        sessionId: values.sessionId,
      };

      await onSend(message);
      form.resetFields();
      onClose();
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal
      title={`Send Message to ${queueName.replace("queue-", "")}`}
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button key="send" type="primary" loading={sending} onClick={handleSubmit}>
          Send
        </Button>,
      ]}
      width={800}
      centered={true}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          contentType: "application/json",
        }}
      >
        <Form.Item name="messageId" label="Message ID">
          <Input placeholder="Optional. If not provided, a random ID will be generated." />
        </Form.Item>

        <Form.Item
          name="body"
          label="Message Body"
          rules={[{ required: true, message: "Please enter message body" }]}
          extra="Enter JSON object or plain text"
        >
          <TextArea
            rows={8}
            placeholder="Enter message body (JSON or plain text)"
            style={{ fontFamily: "monospace" }}
          />
        </Form.Item>

        <div className="grid grid-cols-2 gap-4">
          <Form.Item name="contentType" label="Content Type">
            <Select>
              <Select.Option value="application/json">application/json</Select.Option>
              <Select.Option value="text/plain">text/plain</Select.Option>
              <Select.Option value="application/xml">application/xml</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="correlationId" label="Correlation ID">
            <Input placeholder="Enter correlation ID" />
          </Form.Item>

          <Form.Item name="subject" label="Subject">
            <Input placeholder="Enter subject" />
          </Form.Item>

          <Form.Item name="sessionId" label="Session ID">
            <Input placeholder="Enter session ID" />
          </Form.Item>
        </div>
      </Form>
    </Modal>
  );
};

import React, { useState } from "react";
import { Modal, Form, Input, Button, Select, Collapse, message } from "antd";
import type { ServiceBusMessage } from "../types/serviceBus";
import { DownOutlined } from "@ant-design/icons";

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

      let applicationProperties: Record<string, any> | undefined;
      if (values.applicationProperties) {
        try {
          applicationProperties = JSON.parse(values.applicationProperties);
          if (typeof applicationProperties !== "object" || applicationProperties === null) {
            throw new Error("Application properties must be a valid JSON object");
          }
        } catch (e) {
          throw new Error("Invalid application properties format. Must be a valid JSON object.");
        }
      }

      const message: ServiceBusMessage = {
        messageId: values.messageId,
        body,
        contentType: values.contentType || "application/json",
        correlationId: values.correlationId,
        subject: values.subject,
        sessionId: values.sessionId,
        applicationProperties,
      };

      await onSend(message);
      form.resetFields();
      onClose();
    } catch (error) {
      console.error("Failed to send message:", error);
      if (error instanceof Error) {
        message.error(error.message);
      } else {
        message.error("Failed to send message");
      }
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
      style={{ maxHeight: "80vh" }}
      bodyStyle={{
        maxHeight: "calc(80vh - 120px)",
        overflowY: "auto",
        paddingRight: "16px",
      }}
      centered={true}
      className="send-message-modal"
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          contentType: "application/json",
        }}
        className="pr-4"
      >
        <Form.Item name="messageId" label="Message ID">
          <Input placeholder="Optional. If not provided, a random ID will be generated." />
        </Form.Item>

        <Form.Item
          name="body"
          label="Message Body"
          rules={[{ required: true, message: "Please enter message body" }]}
        >
          <TextArea
            rows={8}
            placeholder="Enter message body (JSON or plain text)"
            style={{ fontFamily: "monospace" }}
          />
        </Form.Item>

        <Form.Item name="contentType" label="Content Type">
          <Select>
            <Select.Option value="application/json">application/json</Select.Option>
            <Select.Option value="text/plain">text/plain</Select.Option>
            <Select.Option value="application/xml">application/xml</Select.Option>
          </Select>
        </Form.Item>

        <Collapse ghost expandIcon={({ isActive }) => <DownOutlined rotate={isActive ? 180 : 0} />}>
          <Collapse.Panel header="Message Properties" key="1">
            <div className="grid grid-cols-2 gap-4">
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
          </Collapse.Panel>

          <Collapse.Panel header="Application Properties" key="2">
            <Form.Item
              name="applicationProperties"
              extra={
                <div>
                  <p>
                    Enter a JSON object of custom properties that can be used for message filtering.
                  </p>
                  <p>Example:</p>
                  <pre className="bg-gray-50 p-2 rounded">
                    {JSON.stringify(
                      {
                        priority: "high",
                        department: "finance",
                        userType: "premium",
                      },
                      null,
                      2
                    )}
                  </pre>
                </div>
              }
            >
              <TextArea
                rows={6}
                placeholder='{"property1": "value1", "property2": "value2"}'
                style={{ fontFamily: "monospace" }}
              />
            </Form.Item>
          </Collapse.Panel>
        </Collapse>
      </Form>
    </Modal>
  );
};

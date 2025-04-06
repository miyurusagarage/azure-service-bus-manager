import React, { useState } from "react";
import { Modal, Form, Input, Switch, InputNumber, Button, Collapse, message, Row, Col } from "antd";
import { useServiceBus } from "../../hooks/useServiceBus";
import { DownOutlined } from "@ant-design/icons";

interface CreateQueueModalProps {
  visible: boolean;
  onCancel: () => void;
}

export const CreateQueueModal: React.FC<CreateQueueModalProps> = ({ visible, onCancel }) => {
  const [form] = Form.useForm();
  const { refreshNamespaceInfo } = useServiceBus();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();

      // Convert form values to queue options
      const options = {
        maxSizeInGB: values.maxSizeInGB,
        messageTimeToLive: values.messageTimeToLive ? `PT${values.messageTimeToLive}H` : undefined,
        lockDuration: values.lockDuration ? `PT${values.lockDuration}M` : undefined,
        enablePartitioning: values.enablePartitioning,
        enableDeadLetteringOnMessageExpiration: values.enableDeadLetteringOnMessageExpiration,
        requiresSession: values.requiresSession,
        maxDeliveryCount: values.maxDeliveryCount,
        enableDuplicateDetection: values.enableDuplicateDetection,
        duplicateDetectionHistoryTimeWindow: values.duplicateDetectionHistoryTimeWindow
          ? `PT${values.duplicateDetectionHistoryTimeWindow}H`
          : undefined,
        enableBatchedOperations: values.enableBatchedOperations,
      };

      const result = await window.electronAPI.createQueue(values.name, options);
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
      width={800}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          messageTimeToLive: 24,
          maxDeliveryCount: 10,
          enableDeadLetteringOnMessageExpiration: true,
          enableBatchedOperations: true,
        }}
      >
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

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="messageTimeToLive" label="Message Time to Live (Hours)">
              <InputNumber min={1} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="maxDeliveryCount" label="Max Delivery Count">
              <InputNumber min={1} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="enableDeadLetteringOnMessageExpiration"
              valuePropName="checked"
              label="Enable Dead Lettering on Message Expiration"
            >
              <Switch />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="requiresSession"
              valuePropName="checked"
              label="Enable Session Support"
            >
              <Switch />
            </Form.Item>
          </Col>
        </Row>

        <Collapse ghost expandIcon={({ isActive }) => <DownOutlined rotate={isActive ? 180 : 0} />}>
          <Collapse.Panel header="Advanced Options" key="1">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="maxSizeInGB" label="Max Size (GB)">
                  <InputNumber min={1} max={5} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="lockDuration" label="Lock Duration (Minutes)">
                  <InputNumber min={1} max={5} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="duplicateDetectionHistoryTimeWindow"
                  label="Duplicate Detection History Time Window (Hours)"
                >
                  <InputNumber min={1} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="enablePartitioning"
                  valuePropName="checked"
                  label="Enable Partitioning"
                >
                  <Switch />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="enableDuplicateDetection"
                  valuePropName="checked"
                  label="Enable Duplicate Detection"
                >
                  <Switch />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="enableBatchedOperations"
                  valuePropName="checked"
                  label="Enable Batched Operations"
                >
                  <Switch />
                </Form.Item>
              </Col>
            </Row>
          </Collapse.Panel>
        </Collapse>
      </Form>
    </Modal>
  );
};

import React, { useState } from "react";
import { Modal, Form, Input, Switch, InputNumber, Collapse, message, Row, Col } from "antd";
import { useServiceBus } from "../../hooks/useServiceBus";
import { DownOutlined } from "@ant-design/icons";

interface CreateTopicModalProps {
  visible: boolean;
  onCancel: () => void;
}

export const CreateTopicModal: React.FC<CreateTopicModalProps> = ({ visible, onCancel }) => {
  const [form] = Form.useForm();
  const { refreshNamespaceInfo } = useServiceBus();
  const [isCreating, setIsCreating] = useState(false);

  const handleOk = async () => {
    try {
      setIsCreating(true);
      const values = await form.validateFields();

      // Convert form values to topic options
      const options = {
        maxSizeInGB: values.maxSizeInGB,
        defaultMessageTimeToLive: values.messageTimeToLive
          ? `PT${values.messageTimeToLive}H`
          : undefined,
        enablePartitioning: values.enablePartitioning,
        enableDuplicateDetection: values.enableDuplicateDetection,
        duplicateDetectionHistoryTimeWindow: values.duplicateDetectionHistoryTimeWindow
          ? `PT${values.duplicateDetectionHistoryTimeWindow}H`
          : undefined,
        enableBatchedOperations: values.enableBatchedOperations,
        supportOrdering: values.supportOrdering,
        autoDeleteOnIdle: values.autoDeleteOnIdle ? `PT${values.autoDeleteOnIdle}H` : undefined,
      };

      const result = await window.electronAPI.createTopic(values.name, options);
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
    } finally {
      setIsCreating(false);
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
      okButtonProps={{ loading: isCreating }}
      confirmLoading={isCreating}
      width={800}
      style={{ maxHeight: "80vh" }}
      bodyStyle={{
        maxHeight: "calc(80vh - 120px)",
        overflowY: "auto",
        paddingRight: "16px",
      }}
      className="create-queue-modal"
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          messageTimeToLive: 24,
          enableBatchedOperations: true,
        }}
      >
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

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="messageTimeToLive" label="Message Time to Live (Hours)">
              <InputNumber min={1} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="autoDeleteOnIdle" label="Auto Delete When Idle (Hours)">
              <InputNumber min={1} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="supportOrdering"
              valuePropName="checked"
              label="Support Message Ordering"
              style={{ marginBottom: 4 }}
            >
              <Switch />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="enableDuplicateDetection"
              valuePropName="checked"
              label="Enable Duplicate Detection"
              style={{ marginBottom: 4 }}
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
                <Form.Item
                  name="duplicateDetectionHistoryTimeWindow"
                  label="Duplicate Detection History Time Window (Hours)"
                >
                  <InputNumber min={1} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="enablePartitioning"
                  valuePropName="checked"
                  label="Enable Partitioning"
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

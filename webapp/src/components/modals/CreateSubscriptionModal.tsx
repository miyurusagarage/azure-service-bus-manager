import React, { useState } from "react";
import { Modal, Form, Input, Select, Switch, InputNumber, Collapse, message, Row, Col } from "antd";
import { useServiceBus } from "../../hooks/useServiceBus";
import { DownOutlined } from "@ant-design/icons";

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
  const [isCreating, setIsCreating] = useState(false);

  const handleOk = async () => {
    try {
      setIsCreating(true);
      const values = await form.validateFields();

      // Convert form values to subscription options
      const options = {
        defaultMessageTimeToLive: values.messageTimeToLive
          ? `PT${values.messageTimeToLive}H`
          : undefined,
        lockDuration: values.lockDuration ? `PT${values.lockDuration}M` : undefined,
        maxDeliveryCount: values.maxDeliveryCount,
        enableDeadLetteringOnMessageExpiration: values.enableDeadLetteringOnMessageExpiration,
        requiresSession: values.requiresSession,
        enableBatchedOperations: values.enableBatchedOperations,
        autoDeleteOnIdle: values.autoDeleteOnIdle ? `PT${values.autoDeleteOnIdle}H` : undefined,
        forwardTo: values.forwardTo,
        forwardDeadLetteredMessagesTo: values.forwardDeadLetteredMessagesTo,
      };

      const result = await window.electronAPI.createSubscription(
        values.topicName,
        values.name,
        options
      );
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
    } finally {
      setIsCreating(false);
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
          maxDeliveryCount: 10,
          enableBatchedOperations: true,
          lockDuration: 1,
        }}
      >
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
              style={{ marginBottom: 4 }}
            >
              <Switch />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="requiresSession"
              valuePropName="checked"
              label="Enable Session Support"
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
                <Form.Item name="lockDuration" label="Lock Duration (Minutes)">
                  <InputNumber min={1} max={5} style={{ width: "100%" }} />
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
                <Form.Item name="forwardTo" label="Forward To">
                  <Select placeholder="Select a queue or topic" allowClear>
                    {namespaceInfo?.queues.map((queue) => (
                      <Select.Option key={`queue-${queue.name}`} value={queue.name}>
                        Queue: {queue.name}
                      </Select.Option>
                    ))}
                    {namespaceInfo?.topics.map((topic) => (
                      <Select.Option key={`topic-${topic}`} value={topic}>
                        Topic: {topic}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="forwardDeadLetteredMessagesTo"
                  label="Forward Dead Lettered Messages To"
                >
                  <Select placeholder="Select a queue or topic" allowClear>
                    {namespaceInfo?.queues.map((queue) => (
                      <Select.Option key={`queue-${queue.name}`} value={queue.name}>
                        Queue: {queue.name}
                      </Select.Option>
                    ))}
                    {namespaceInfo?.topics.map((topic) => (
                      <Select.Option key={`topic-${topic}`} value={topic}>
                        Topic: {topic}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="enableBatchedOperations"
              valuePropName="checked"
              label="Enable Batched Operations"
            >
              <Switch />
            </Form.Item>
          </Collapse.Panel>
        </Collapse>
      </Form>
    </Modal>
  );
};

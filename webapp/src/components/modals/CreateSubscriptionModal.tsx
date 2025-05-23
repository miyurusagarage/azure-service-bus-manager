import React, { useState } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  Switch,
  InputNumber,
  Collapse,
  message,
  Row,
  Col,
  Radio,
  Space,
} from "antd";
import { useServiceBus } from "../../hooks/useServiceBus";
import { DownOutlined } from "@ant-design/icons";

interface CreateSubscriptionModalProps {
  visible: boolean;
  onCancel: () => void;
}

interface SubscriptionOptions {
  defaultMessageTimeToLive?: string;
  lockDuration?: string;
  maxDeliveryCount?: number;
  enableDeadLetteringOnMessageExpiration?: boolean;
  requiresSession?: boolean;
  enableBatchedOperations?: boolean;
  autoDeleteOnIdle?: string;
  forwardTo?: string;
  forwardDeadLetteredMessagesTo?: string;
  sqlFilter?: string;
  correlationFilter?: {
    correlationId?: string;
    messageId?: string;
    to?: string;
    replyTo?: string;
    label?: string;
    sessionId?: string;
    replyToSessionId?: string;
    contentType?: string;
    userProperties?: Record<string, any>;
  };
}

export const CreateSubscriptionModal: React.FC<CreateSubscriptionModalProps> = ({
  visible,
  onCancel,
}) => {
  const [form] = Form.useForm();
  const { namespaceInfo, refreshNamespaceInfo } = useServiceBus();
  const [isCreating, setIsCreating] = useState(false);
  const [filterType, setFilterType] = useState<"none" | "sql" | "correlation">("none");

  const handleOk = async () => {
    try {
      setIsCreating(true);
      const values = await form.validateFields();

      // Convert form values to subscription options
      const options: SubscriptionOptions = {
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

      // Add filter options based on the selected filter type
      if (filterType === "sql") {
        options.sqlFilter = values.sqlFilter;
      } else if (filterType === "correlation") {
        options.correlationFilter = {
          correlationId: values.correlationId,
          messageId: values.messageId,
          to: values.to,
          replyTo: values.replyTo,
          label: values.label,
          sessionId: values.sessionId,
          replyToSessionId: values.replyToSessionId,
          contentType: values.contentType,
          userProperties: values.userProperties ? JSON.parse(values.userProperties) : undefined,
        };
      }

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

          <Collapse.Panel header="Filter Options" key="2">
            <Form.Item label="Filter Type">
              <Radio.Group value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                <Space direction="vertical">
                  <Radio value="none">No Filter</Radio>
                  <Radio value="sql">SQL Filter</Radio>
                  <Radio value="correlation">Correlation Filter</Radio>
                </Space>
              </Radio.Group>
            </Form.Item>

            {filterType === "sql" && (
              <Form.Item
                name="sqlFilter"
                label="SQL Filter Expression"
                rules={[
                  { required: true, message: "Please enter a SQL filter expression" },
                  {
                    validator: (_, value) => {
                      if (!value?.trim()) {
                        return Promise.reject("SQL filter expression cannot be empty");
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
                extra="Example: user.age > 18 AND user.type = 'premium'"
              >
                <Input.TextArea
                  placeholder="Enter SQL filter expression"
                  autoSize={{ minRows: 2, maxRows: 6 }}
                />
              </Form.Item>
            )}

            {filterType === "correlation" && (
              <>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="correlationId" label="Correlation ID">
                      <Input placeholder="Enter correlation ID" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="messageId" label="Message ID">
                      <Input placeholder="Enter message ID" />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="to" label="To">
                      <Input placeholder="Enter to address" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="replyTo" label="Reply To">
                      <Input placeholder="Enter reply to address" />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="label" label="Label">
                      <Input placeholder="Enter label" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="sessionId" label="Session ID">
                      <Input placeholder="Enter session ID" />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="replyToSessionId" label="Reply To Session ID">
                      <Input placeholder="Enter reply to session ID" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="contentType" label="Content Type">
                      <Input placeholder="Enter content type" />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  name="userProperties"
                  label="User Properties"
                  extra="Enter a JSON object of custom properties"
                >
                  <Input.TextArea
                    placeholder='{"property1": "value1", "property2": "value2"}'
                    autoSize={{ minRows: 2, maxRows: 6 }}
                  />
                </Form.Item>
              </>
            )}
          </Collapse.Panel>
        </Collapse>
      </Form>
    </Modal>
  );
};

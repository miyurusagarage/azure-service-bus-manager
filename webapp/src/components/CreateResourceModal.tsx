import React, { useState } from "react";
import { Modal, Form, Input, message, Button, Dropdown } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import type { MenuProps } from "antd";

type ResourceType = "queue" | "topic" | "subscription";

export const CreateResourceModal: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [resourceType, setResourceType] = useState<ResourceType | null>(null);
  const [form] = Form.useForm();

  const handleCreateResource = (type: ResourceType) => {
    setResourceType(type);
    setVisible(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      // TODO: Implement the actual creation logic
      message.success(`${resourceType} created successfully`);
      setVisible(false);
      form.resetFields();
    } catch (error) {
      // Form validation error
    }
  };

  const handleModalCancel = () => {
    setVisible(false);
    form.resetFields();
  };

  return (
    <>
      <div className="px-4 py-3 border-t border-gray-200 bg-white">
        <Dropdown
          menu={{
            items: [
              {
                key: "queue",
                label: "Create Queue",
                onClick: () => handleCreateResource("queue"),
              },
              {
                key: "topic",
                label: "Create Topic",
                onClick: () => handleCreateResource("topic"),
              },
              {
                key: "subscription",
                label: "Create Subscription",
                onClick: () => handleCreateResource("subscription"),
              },
            ],
          }}
          placement="topLeft"
          trigger={["click"]}
        >
          <Button
            type="primary"
            icon={<PlusOutlined />}
            className="w-full flex items-center justify-center"
          >
            Create
          </Button>
        </Dropdown>
      </div>
      <Modal
        title={
          resourceType
            ? `Create New ${resourceType.charAt(0).toUpperCase() + resourceType.slice(1)}`
            : "Create New Resource"
        }
        open={visible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        okText="Create"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label={
              resourceType
                ? `${resourceType.charAt(0).toUpperCase() + resourceType.slice(1)} Name`
                : "Resource Name"
            }
            rules={[{ required: true, message: "Please enter a name" }]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

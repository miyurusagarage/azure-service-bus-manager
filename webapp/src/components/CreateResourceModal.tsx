import React, { useState } from "react";
import { Button, Dropdown, message } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import type { MenuProps } from "antd";
import { CreateQueueModal } from "./modals/CreateQueueModal";
import { CreateTopicModal } from "./modals/CreateTopicModal";
import { CreateSubscriptionModal } from "./modals/CreateSubscriptionModal";

type ResourceType = "queue" | "topic" | "subscription";

export const CreateResourceModal: React.FC = () => {
  const [resourceType, setResourceType] = useState<ResourceType | null>(null);

  const handleCreateResource = (type: ResourceType) => {
    setResourceType(type);
  };

  const handleCancel = () => {
    setResourceType(null);
  };

  const handleCreateQueue = async (values: { name: string }) => {
    try {
      // TODO: Implement queue creation
      message.success(`Queue "${values.name}" created successfully`);
      setResourceType(null);
    } catch (error) {
      message.error("Failed to create queue");
    }
  };

  const handleCreateTopic = async (values: { name: string }) => {
    try {
      // TODO: Implement topic creation
      message.success(`Topic "${values.name}" created successfully`);
      setResourceType(null);
    } catch (error) {
      message.error("Failed to create topic");
    }
  };

  const handleCreateSubscription = async (values: { name: string; topicName: string }) => {
    try {
      // TODO: Implement subscription creation
      message.success(`Subscription "${values.name}" created successfully`);
      setResourceType(null);
    } catch (error) {
      message.error("Failed to create subscription");
    }
  };

  const items: MenuProps["items"] = [
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
  ];

  return (
    <>
      <div className="px-4 py-3 border-t border-gray-200 bg-white">
        <Dropdown menu={{ items }} placement="topLeft" trigger={["click"]}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            className="w-full flex items-center justify-center"
          >
            Create
          </Button>
        </Dropdown>
      </div>
      <CreateQueueModal
        visible={resourceType === "queue"}
        onCancel={handleCancel}
        onOk={handleCreateQueue}
      />
      <CreateTopicModal
        visible={resourceType === "topic"}
        onCancel={handleCancel}
        onOk={handleCreateTopic}
      />
      <CreateSubscriptionModal
        visible={resourceType === "subscription"}
        onCancel={handleCancel}
        onOk={handleCreateSubscription}
      />
    </>
  );
};

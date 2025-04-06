import React, { useState } from "react";
import { Button, Dropdown } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import type { MenuProps } from "antd";
import { CreateQueueModal } from "./modals/CreateQueueModal";
import { CreateTopicModal } from "./modals/CreateTopicModal";
import { CreateSubscriptionModal } from "./modals/CreateSubscriptionModal";

type ResourceType = "queue" | "topic" | "subscription";

export const CreateResourceModal: React.FC = () => {
  const [resourceType, setResourceType] = useState<ResourceType | null>(null);

  const items: MenuProps["items"] = [
    {
      key: "queue",
      label: "Create Queue",
      onClick: () => setResourceType("queue"),
    },
    {
      key: "topic",
      label: "Create Topic",
      onClick: () => setResourceType("topic"),
    },
    {
      key: "subscription",
      label: "Create Subscription",
      onClick: () => setResourceType("subscription"),
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
      <CreateQueueModal visible={resourceType === "queue"} onCancel={() => setResourceType(null)} />
      <CreateTopicModal visible={resourceType === "topic"} onCancel={() => setResourceType(null)} />
      <CreateSubscriptionModal
        visible={resourceType === "subscription"}
        onCancel={() => setResourceType(null)}
      />
    </>
  );
};

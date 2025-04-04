import React from "react";
import { Tree, Input } from "antd";
import { FolderOutlined, MessageOutlined, BellOutlined } from "@ant-design/icons";
import type { TreeItem } from "../types/serviceBus";

interface ServiceBusTreeProps {
  namespaceInfo: {
    name: string;
    endpoint: string;
    queues: Array<{
      name: string;
      activeMessageCount: number;
      messageCount: number;
      deadLetterCount: number;
    }>;
    topics: string[];
  } | null;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedNode: string | null;
  onNodeSelect: (node: string | null) => void;
}

export const ServiceBusTree: React.FC<ServiceBusTreeProps> = ({
  namespaceInfo,
  searchTerm,
  onSearchChange,
  selectedNode,
  onNodeSelect,
}) => {
  const getTreeData = (): TreeItem[] => {
    if (!namespaceInfo) return [];

    const filterItems = (items: any[], isTopics: boolean = false) => {
      const searchLower = searchTerm.toLowerCase();
      return items.filter((item) =>
        isTopics
          ? item.toLowerCase().includes(searchLower)
          : item.name?.toLowerCase().includes(searchLower)
      );
    };

    const filteredQueues = filterItems(namespaceInfo.queues);
    const filteredTopics = filterItems(namespaceInfo.topics, true);

    const showAll = searchTerm.length === 0;

    return [
      ...(showAll || filteredQueues.length > 0
        ? [
            {
              title: "Queues",
              key: "queues",
              icon: <MessageOutlined />,
              children: filteredQueues.map((queue) => ({
                title: (
                  <span className="flex items-start">
                    <span className="break-words pr-2">{queue.name}</span>
                    <span className="text-gray-500 whitespace-nowrap">
                      ({queue.activeMessageCount}/{queue.deadLetterCount})
                    </span>
                  </span>
                ),
                key: `queue-${queue.name}`,
              })),
            },
          ]
        : []),
      ...(showAll || filteredTopics.length > 0
        ? [
            {
              title: "Topics",
              key: "topics",
              icon: <FolderOutlined />,
              children: filteredTopics.map((topic) => ({
                title: topic,
                key: `topic-${topic}`,
                icon: <BellOutlined />,
              })),
            },
          ]
        : []),
    ];
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="text-sm text-gray-500">Namespace</div>
        <div className="font-medium">{namespaceInfo?.name}</div>
        <div className="text-xs text-gray-400 truncate">{namespaceInfo?.endpoint}</div>
      </div>
      <Input.Search
        placeholder="Search queues and topics..."
        className="mb-4"
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        allowClear
      />
      <Tree
        treeData={getTreeData()}
        selectedKeys={selectedNode ? [selectedNode] : []}
        onSelect={(selectedKeys) => {
          const selected = selectedKeys[0]?.toString();
          onNodeSelect(selected || null);
        }}
        showIcon
        defaultExpandAll
        style={{
          fontSize: "14px",
          lineHeight: "1.5",
          padding: "0 8px",
        }}
        className="[&_.ant-tree-switcher]:mr-0 [&_.ant-tree-node-content-wrapper]:pl-1 [&_.ant-tree-switcher]:w-5 [&_.ant-tree-switcher:before]:w-5 [&_.ant-tree-node-content-wrapper]:border-b [&_.ant-tree-node-content-wrapper]:border-gray-100 [&_.ant-tree-treenode]:py-1 [&_.ant-tree-node-content-wrapper]:transition-colors [&_.ant-tree-node-content-wrapper:hover]:!bg-gray-50 [&_.ant-tree-node-selected]:!bg-blue-50 [&_.ant-tree-indent-unit]:!w-3 [&_.ant-tree-switcher]:!w-3 [&_.ant-tree-node-content-wrapper]:ml-0"
      />
    </div>
  );
};

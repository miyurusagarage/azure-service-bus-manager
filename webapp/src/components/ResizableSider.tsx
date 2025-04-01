import React, { useState, useEffect } from "react";
import { Tree, Input } from "antd";
import { FolderOutlined, ApiOutlined, MessageOutlined } from "@ant-design/icons";
import { useServiceBusStore } from "../stores/serviceBusStore";
import type { TreeItem } from "../types/serviceBus";

interface Queue {
  name: string;
  activeMessageCount: number;
  messageCount: number;
}

export const ResizableSider: React.FC = () => {
  const [width, setWidth] = useState(300);
  const [isResizing, setIsResizing] = useState(false);
  const { selectedNode, setSelectedNode, searchTerm, setSearchTerm, namespaceInfo } =
    useServiceBusStore();

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  };

  useEffect(() => {
    if (isResizing) {
      const handleMouseMove = (e: MouseEvent) => {
        const newWidth = e.clientX;
        if (newWidth >= 200 && newWidth <= 600) {
          setWidth(newWidth);
        }
      };

      const handleMouseUp = () => {
        setIsResizing(false);
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);

      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isResizing]);

  const getTreeData = (): TreeItem[] => {
    if (!namespaceInfo) return [];

    const filteredQueues = namespaceInfo.queues.filter((queue: Queue) =>
      queue.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const filteredTopics = namespaceInfo.topics.filter((topic: string) =>
      topic.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return [
      {
        title: "Queues",
        key: "queues",
        icon: <MessageOutlined />,
        children: filteredQueues.map((queue: Queue) => ({
          title: `${queue.name} (${queue.activeMessageCount}/${queue.messageCount})`,
          key: `queue-${queue.name}`,
          icon: <MessageOutlined />,
        })),
      },
      {
        title: "Topics",
        key: "topics",
        icon: <ApiOutlined />,
        children: filteredTopics.map((topic: string) => ({
          title: topic,
          key: `topic-${topic}`,
          icon: <ApiOutlined />,
        })),
      },
    ];
  };

  return (
    <div className="relative flex h-full overflow-hidden">
      <div
        className="bg-white border-r border-gray-200 overflow-y-auto h-full"
        style={{ width: `${width}px` }}
      >
        <div className="p-4">
          {namespaceInfo && (
            <div className="mb-4">
              <div className="text-sm font-medium text-gray-500">Namespace</div>
              <div className="text-sm truncate">{namespaceInfo.name}</div>
              <div className="text-xs text-gray-400 truncate">{namespaceInfo.endpoint}</div>
            </div>
          )}
          <Input.Search
            placeholder="Search queues and topics..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-4"
          />
          <Tree
            showIcon
            defaultExpandAll
            treeData={getTreeData()}
            selectedKeys={selectedNode ? [selectedNode] : []}
            onSelect={(selectedKeys) => {
              if (selectedKeys.length > 0) {
                setSelectedNode(selectedKeys[0] as string);
              }
            }}
          />
        </div>
      </div>
      <div
        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500"
        onMouseDown={handleMouseDown}
      />
    </div>
  );
};

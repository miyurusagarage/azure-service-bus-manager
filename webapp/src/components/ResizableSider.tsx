import React, { useState, useEffect } from "react";
import { useServiceBusStore } from "../stores/serviceBusStore";
import { ServiceBusTree } from "./ServiceBusTree";
import { CreateResourceModal } from "./CreateResourceModal";

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

  return (
    <div className="relative flex h-full overflow-hidden">
      <div
        className="bg-white border-r border-gray-200 overflow-y-auto h-full flex flex-col"
        style={{ width: `${width}px` }}
      >
        <div className="flex-1 p-4">
          <ServiceBusTree
            namespaceInfo={namespaceInfo}
            searchTerm={searchTerm}
            onSearchChange={(value) => setSearchTerm(value)}
            selectedNode={selectedNode}
            onNodeSelect={(node) => setSelectedNode(node)}
          />
        </div>
        <CreateResourceModal />
      </div>
      <div
        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500"
        onMouseDown={handleMouseDown}
      />
    </div>
  );
};

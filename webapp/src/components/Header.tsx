import React from "react";
import { Layout, Button, Tag } from "antd";
import { DisconnectOutlined, ApiOutlined } from "@ant-design/icons";
import { useServiceBus } from "../hooks/useServiceBus";
import { useServiceBusStore } from "../stores/serviceBusStore";

const { Header: AntHeader } = Layout;

export const Header: React.FC = () => {
  const { handleDisconnect } = useServiceBus();
  const { namespaceInfo } = useServiceBusStore();

  return (
    <AntHeader className="bg-white border-b border-gray-200 px-6 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <ApiOutlined
            className={`text-2xl ${namespaceInfo ? "text-green-600" : "text-blue-600"}`}
          />
          <div className="text-lg font-semibold">Azure Service Bus Manager</div>
        </div>
        {namespaceInfo && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Connected to:</span>
            <Tag color="blue">{namespaceInfo.name}</Tag>
            <span className="text-sm text-gray-500">{namespaceInfo.endpoint}</span>
          </div>
        )}
      </div>
      <Button
        type="text"
        icon={<DisconnectOutlined />}
        onClick={handleDisconnect}
        danger
        className="bg-red-50 hover:!bg-red-100 border-none"
      >
        Disconnect
      </Button>
    </AntHeader>
  );
};

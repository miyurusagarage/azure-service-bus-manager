import React from "react";
import { Layout, Button } from "antd";
import { DisconnectOutlined, ApiOutlined } from "@ant-design/icons";
import { useServiceBus } from "../hooks/useServiceBus";

const { Header: AntHeader } = Layout;

export const Header: React.FC = () => {
  const { handleDisconnect } = useServiceBus();

  return (
    <AntHeader className="bg-white border-b border-gray-200 px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <ApiOutlined className="text-2xl text-blue-600" />
        <div className="text-xl font-semibold">Azure Service Bus Manager</div>
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

import React from "react";
import { Layout, Button } from "antd";
import { DisconnectOutlined } from "@ant-design/icons";
import { useServiceBus } from "../hooks/useServiceBus";

const { Header: AntHeader } = Layout;

export const Header: React.FC = () => {
  const { handleDisconnect } = useServiceBus();

  return (
    <AntHeader className="bg-white border-b border-gray-200 px-6 flex items-center justify-between">
      <div className="text-xl font-semibold">Azure Service Bus Manager</div>
      <Button type="text" icon={<DisconnectOutlined />} onClick={handleDisconnect} danger>
        Disconnect
      </Button>
    </AntHeader>
  );
};

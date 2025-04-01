import React from "react";
import { Button } from "antd";
import { ApiOutlined } from "@ant-design/icons";
import { ConnectionModal } from "./ConnectionModal";
import { useServiceBusStore } from "../stores/serviceBusStore";
import { useServiceBus } from "../hooks/useServiceBus";

export const ConnectionPrompt: React.FC = () => {
  const [showConnectionModal, setShowConnectionModal] = React.useState(false);
  const { error, isLoading } = useServiceBusStore();
  const { handleConnect } = useServiceBus();

  const handleConnection = async (connectionString: string) => {
    const success = await handleConnect(connectionString);
    if (success) {
      setShowConnectionModal(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <ApiOutlined className="text-5xl text-blue-600 mb-4" />
        <h1 className="text-2xl font-semibold mb-4">Azure Service Bus Manager</h1>
        <Button
          type="primary"
          size="large"
          onClick={() => setShowConnectionModal(true)}
          loading={isLoading}
        >
          Connect to Service Bus
        </Button>
      </div>

      <ConnectionModal
        visible={showConnectionModal}
        onClose={() => setShowConnectionModal(false)}
        onConnect={handleConnection}
        isLoading={isLoading}
        error={error}
      />
    </div>
  );
};

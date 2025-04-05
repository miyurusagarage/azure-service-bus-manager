import React from "react";
import { Modal, Input, Button, Alert } from "antd";
import { ApiOutlined } from "@ant-design/icons";
import type { ServiceBusError } from "../types/serviceBus";

const { TextArea } = Input;

interface ConnectionModalProps {
  visible: boolean;
  onClose: () => void;
  onConnect: (connectionString: string) => Promise<void>;
  isLoading: boolean;
  error: ServiceBusError | null;
}

export const ConnectionModal: React.FC<ConnectionModalProps> = ({
  visible,
  onClose,
  onConnect,
  isLoading,
  error,
}) => {
  const [connectionString, setConnectionString] = React.useState("");

  const handleConnect = async () => {
    await onConnect(connectionString);
  };

  return (
    <Modal
      title={
        <div className="flex items-center">
          <ApiOutlined className="text-2xl text-blue-600 mr-3" />
          <span>Connect to Azure Service Bus</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={600}
      centered={true}
    >
      <div className="space-y-4">
        <div>
          <div className="text-sm text-gray-500 mb-1">Connection String</div>
          <TextArea
            value={connectionString}
            onChange={(e) => setConnectionString(e.target.value)}
            placeholder="Enter your Azure Service Bus connection string"
            className="w-full"
            rows={4}
            style={{ fontFamily: "monospace" }}
          />
        </div>
        {error && (
          <Alert message="Connection Error" description={error.message} type="error" showIcon />
        )}
        <div className="flex justify-end space-x-2">
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="primary"
            onClick={handleConnect}
            loading={isLoading}
            disabled={!connectionString.trim()}
          >
            Connect
          </Button>
        </div>
      </div>
    </Modal>
  );
};

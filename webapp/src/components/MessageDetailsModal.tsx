import React from "react";
import { Modal, Button, message as antMessage } from "antd";
import { CopyOutlined } from "@ant-design/icons";
import type { ServiceBusMessage } from "../types/serviceBus";

interface MessageDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  message: ServiceBusMessage | null;
}

export const MessageDetailsModal: React.FC<MessageDetailsModalProps> = ({
  visible,
  onClose,
  message,
}) => {
  if (!message) return null;

  const handleCopyBody = () => {
    navigator.clipboard
      .writeText(JSON.stringify(message.body, null, 2))
      .then(() => antMessage.success("Body copied to clipboard"))
      .catch(() => antMessage.error("Failed to copy body"));
  };

  return (
    <Modal
      title="Message Details"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
      centered={true}
      styles={{
        body: {
          height: "calc(100vh - 140px)",
          padding: "24px 24px 0 24px",
        },
      }}
    >
      <div className="h-full flex flex-col">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-sm text-gray-500">Message ID</div>
            <div className="font-mono">{message.messageId || "N/A"}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Sequence Number</div>
            <div className="font-mono">{message.sequenceNumber?.toString() || "N/A"}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Content Type</div>
            <div>{message.contentType?.replace("application/", "") || "N/A"}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Enqueued Time</div>
            <div>{message.enqueuedTime?.toLocaleString() || "N/A"}</div>
          </div>
        </div>
        <div className="flex-1 overflow-auto space-y-4 pr-6 -mr-6 pb-6">
          <div>
            <div className="flex justify-between items-center sticky top-0 bg-white py-2">
              <div className="text-sm text-gray-500">Body</div>
              <Button size="small" icon={<CopyOutlined />} onClick={handleCopyBody}>
                Copy
              </Button>
            </div>
            <pre className="bg-gray-50 p-4 rounded-lg overflow-auto">
              {JSON.stringify(message.body, null, 2)}
            </pre>
          </div>
          {message.applicationProperties &&
            Object.keys(message.applicationProperties).length > 0 && (
              <div>
                <div className="text-sm text-gray-500 sticky top-0 bg-white py-2">
                  Application Properties
                </div>
                <pre className="bg-gray-50 p-4 rounded-lg overflow-auto">
                  {JSON.stringify(message.applicationProperties, null, 2)}
                </pre>
              </div>
            )}
          {message.systemProperties && Object.keys(message.systemProperties).length > 0 && (
            <div>
              <div className="text-sm text-gray-500 sticky top-0 bg-white py-2">
                System Properties
              </div>
              <pre className="bg-gray-50 p-4 rounded-lg overflow-auto">
                {JSON.stringify(message.systemProperties, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

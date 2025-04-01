import React from "react";
import { Modal } from "antd";
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

  return (
    <Modal title="Message Details" open={visible} onCancel={onClose} footer={null} width={800}>
      <div className="space-y-4">
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
          <div className="text-sm text-gray-500">Correlation ID</div>
          <div>{message.correlationId || "N/A"}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Subject</div>
          <div>{message.subject || "N/A"}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Session ID</div>
          <div>{message.sessionId || "N/A"}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Enqueued Time</div>
          <div>{message.enqueuedTime?.toLocaleString() || "N/A"}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Body</div>
          <pre className="bg-gray-50 p-4 rounded-lg overflow-auto max-h-[400px]">
            {JSON.stringify(message.body, null, 2)}
          </pre>
        </div>
        {message.applicationProperties && Object.keys(message.applicationProperties).length > 0 && (
          <div>
            <div className="text-sm text-gray-500">Application Properties</div>
            <pre className="bg-gray-50 p-4 rounded-lg overflow-auto max-h-[400px]">
              {JSON.stringify(message.applicationProperties, null, 2)}
            </pre>
          </div>
        )}
        {message.systemProperties && Object.keys(message.systemProperties).length > 0 && (
          <div>
            <div className="text-sm text-gray-500">System Properties</div>
            <pre className="bg-gray-50 p-4 rounded-lg overflow-auto max-h-[400px]">
              {JSON.stringify(message.systemProperties, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </Modal>
  );
};

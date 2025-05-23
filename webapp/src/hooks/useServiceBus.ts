import { useServiceBusStore } from "../stores/serviceBusStore";
import type { ServiceBusMessage, ServiceBusError, QueueInfo } from "../types/serviceBus";
import { message as antMessage } from "antd";

interface NamespaceInfo {
  name: string;
  endpoint: string;
  queues: QueueInfo[];
  topics: string[];
}

export const useServiceBus = () => {
  const {
    isConnected,
    namespaceInfo,
    error,
    isLoading,
    messages,
    isLoadingMessages,
    dlqMessages,
    isLoadingDlqMessages,
    deletingMessage,
    resendingMessage,
    lastConnectionString,
    viewMode,
    setViewMode,
    setError,
    setLoading,
    setConnected,
    setNamespaceInfo,
    setLastConnectionString,
    setMessages,
    setDlqMessages,
    setDeletingMessage,
    setResendingMessage,
    setIsLoadingMessages,
    setIsLoadingDlqMessages,
    resetState,
  } = useServiceBusStore();

  const handleViewMessage = (message: ServiceBusMessage) => {
    // For now, we'll just show the message in a notification
    antMessage.info(JSON.stringify(message, null, 2));
  };

  const refreshQueueInfo = async () => {
    if (!isConnected || !namespaceInfo) return;

    try {
      const queuesResult = await window.electronAPI.listQueues();
      if (queuesResult.success && queuesResult.data) {
        setNamespaceInfo({
          ...namespaceInfo,
          queues: queuesResult.data,
        });
      }
    } catch (error) {
      console.error("Failed to refresh queue info:", error);
    }
  };

  const refreshNamespaceInfo = async () => {
    if (!isConnected || !namespaceInfo) return;

    try {
      const [queuesResult, topicsResult] = await Promise.all([
        window.electronAPI.listQueues(),
        window.electronAPI.listTopics(),
      ]);

      if (queuesResult.success && topicsResult.success) {
        setNamespaceInfo({
          ...namespaceInfo,
          queues: queuesResult.data || [],
          topics: topicsResult.data || [],
        });
      }
    } catch (error) {
      console.error("Failed to refresh namespace info:", error);
    }
  };

  const handleDeleteMessage = async (
    message: ServiceBusMessage,
    queueName: string,
    isDlq: boolean = false
  ) => {
    const messageKey = message.sequenceNumber?.toString();
    if (!messageKey) {
      console.error("Message has no sequence number:", message);
      return;
    }

    try {
      setDeletingMessage(messageKey, true);
      const cleanQueueName = queueName.replace(/^queue-/, "");

      const result = await window.electronAPI.deleteMessage(cleanQueueName, message, isDlq);

      // If we get a "Message not found" error, it means the message was already deleted
      if (!result.success && result.error?.includes("Message not found")) {
        // Show success message since the message is gone
        antMessage.success("Message deleted successfully");
      } else if (!result.success) {
        throw new Error(result.error || "Failed to delete message");
      } else {
        // Show success message
        antMessage.success("Message deleted successfully");
      }

      // Add a small delay before refreshing to allow Service Bus to process the deletion
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Refresh the messages and queue info after successful delete
      await Promise.all([
        isDlq ? handlePeekDlqMessages(cleanQueueName) : handlePeekMessages(cleanQueueName),
        refreshQueueInfo(),
      ]);
    } catch (error) {
      console.error("Failed to delete message:", error);
      // Show error message
      antMessage.error(
        "Failed to delete message: " + (error instanceof Error ? error.message : String(error))
      );
    } finally {
      setDeletingMessage(messageKey, false);
    }
  };

  const handlePeekMessages = async (queueName: string, pageSize: number = 10) => {
    try {
      setIsLoadingMessages(true);
      const cleanQueueName = queueName.replace(/^(queue-|topic-)/, "");

      // Check if this is a topic subscription
      if (queueName.includes("/Subscriptions/")) {
        const [topicName, subscriptionName] = cleanQueueName.split("/Subscriptions/");
        const result = await window.electronAPI.peekSubscriptionMessages(
          topicName,
          subscriptionName,
          pageSize
        );

        if (!result.success) {
          throw new Error(result.error || "Failed to peek messages");
        }

        setMessages(result.data || []);
      } else {
        const result = await window.electronAPI.peekQueueMessages(cleanQueueName, pageSize);

        if (!result.success) {
          throw new Error(result.error || "Failed to peek messages");
        }

        setMessages(result.data || []);
      }
    } catch (error) {
      console.error("Failed to peek messages:", error);
      setError({
        message: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handlePeekDlqMessages = async (queueName: string, pageSize: number = 10) => {
    try {
      setIsLoadingDlqMessages(true);
      const cleanQueueName = queueName.replace(/^queue-/, "");

      const result = await window.electronAPI.peekQueueDeadLetterMessages(cleanQueueName, pageSize);

      if (!result.success) {
        throw new Error(result.error || "Failed to peek DLQ messages");
      }

      setDlqMessages(result.data || []);
    } catch (error) {
      console.error("Failed to peek DLQ messages:", error);
      setError({
        message: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIsLoadingDlqMessages(false);
    }
  };

  const handleResendMessage = async (message: ServiceBusMessage, queueName: string) => {
    const messageKey = message.sequenceNumber?.toString();
    if (!messageKey) {
      console.error("Message has no sequence number:", message);
      return;
    }

    try {
      setResendingMessage(messageKey, true);
      const cleanQueueName = queueName.replace(/^queue-/, "");

      // Send the message back to the main queue
      const result = await window.electronAPI.sendMessage(cleanQueueName, message);
      if (!result.success) {
        throw new Error(result.error || "Failed to resend message");
      }

      // In receive mode, also delete the message from DLQ
      if (viewMode === "receive") {
        const deleteResult = await window.electronAPI.deleteMessage(cleanQueueName, message, true);
        if (!deleteResult.success && !deleteResult.error?.includes("Message not found")) {
          throw new Error(deleteResult.error || "Failed to delete message from DLQ after resend");
        }
      }

      // Show success message
      antMessage.success(
        `Message ${viewMode === "receive" ? "moved" : "copied"} to main queue successfully`
      );

      // Add a small delay before refreshing to allow Service Bus to process the operations
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Refresh both the DLQ messages and queue info after successful resend
      await Promise.all([handlePeekDlqMessages(cleanQueueName), refreshQueueInfo()]);
    } catch (error) {
      console.error("Failed to resend message:", error);
      // Show error message
      antMessage.error(
        "Failed to resend message: " + (error instanceof Error ? error.message : String(error))
      );
    } finally {
      setResendingMessage(messageKey, false);
    }
  };

  const handleConnect = async (connectionString: string) => {
    try {
      setLoading(true);
      setError(null);

      const result = await window.electronAPI.connectServiceBus(connectionString);

      if (!result.success || !result.data) {
        let errorData: ServiceBusError;
        try {
          errorData = result.error ? JSON.parse(result.error) : { message: "Failed to connect" };
        } catch (e) {
          errorData = {
            message: "Failed to connect",
            details: result.error,
          };
        }
        throw new Error(JSON.stringify(errorData));
      }

      const { name, endpoint } = result.data;

      const queuesResult = await window.electronAPI.listQueues();
      const topicsResult = await window.electronAPI.listTopics();

      if (!queuesResult.success || !topicsResult.success) {
        let errorData: ServiceBusError;
        try {
          errorData = queuesResult.error
            ? JSON.parse(queuesResult.error)
            : topicsResult.error
              ? JSON.parse(topicsResult.error)
              : { message: "Failed to fetch queues and topics" };
        } catch (e) {
          errorData = {
            message: "Failed to fetch queues and topics",
            details: queuesResult.error || topicsResult.error,
          };
        }
        throw new Error(JSON.stringify(errorData));
      }

      setNamespaceInfo({
        name,
        endpoint,
        queues: queuesResult.data || [],
        topics: topicsResult.data || [],
      });

      setLastConnectionString(connectionString);
      setConnected(true);
      return true;
    } catch (error) {
      console.error("Failed to connect:", error);
      let errorData: ServiceBusError;
      try {
        errorData = JSON.parse(
          error instanceof Error ? error.message : '{"message": "An unexpected error occurred"}'
        );
      } catch (e) {
        errorData = {
          message: "An unexpected error occurred",
          details: error instanceof Error ? error.message : String(error),
        };
      }
      setError(errorData);
      setConnected(false);
      setNamespaceInfo(null);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await window.electronAPI.disconnectServiceBus();
      resetState();
      return true;
    } catch (error) {
      console.error("Failed to disconnect:", error);
      return false;
    }
  };

  const handleSendMessage = async (message: ServiceBusMessage, queueName: string) => {
    try {
      const cleanQueueName = queueName.replace(/^queue-/, "");

      const result = await window.electronAPI.sendMessage(cleanQueueName, message);
      if (!result.success) {
        throw new Error(result.error || "Failed to send message");
      }

      // Show success message
      antMessage.success("Message sent successfully");

      // Add a small delay before refreshing to allow Service Bus to process the send
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Refresh the messages and queue info after successful send
      await Promise.all([handlePeekMessages(cleanQueueName), refreshQueueInfo()]);
    } catch (error) {
      console.error("Failed to send message:", error);
      // Show error message
      antMessage.error(
        "Failed to send message: " + (error instanceof Error ? error.message : String(error))
      );
      throw error;
    }
  };

  return {
    isConnected,
    namespaceInfo,
    error,
    isLoading,
    messages,
    isLoadingMessages,
    dlqMessages,
    isLoadingDlqMessages,
    deletingMessage,
    resendingMessage,
    viewMode,
    setViewMode,
    handlePeekMessages,
    handlePeekDlqMessages,
    handleDeleteMessage,
    handleResendMessage,
    handleViewMessage,
    handleSendMessage,
    handleConnect,
    handleDisconnect,
    refreshNamespaceInfo,
  };
};

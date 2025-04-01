import { useServiceBusStore } from "../stores/serviceBusStore";
import type { ServiceBusMessage, ServiceBusError, QueueInfo } from "../types/serviceBus";

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
    resendingMessage,
    lastConnectionString,
    setError,
    setLoading,
    setConnected,
    setNamespaceInfo,
    setLastConnectionString,
    setMessages,
    setDlqMessages,
    setResendingMessage,
    setIsLoadingMessages,
    setIsLoadingDlqMessages,
    resetState,
  } = useServiceBusStore();

  const handleResendMessage = async (message: ServiceBusMessage, queueName: string) => {
    const messageKey = message.messageId || message.sequenceNumber?.toString() || "";
    try {
      setResendingMessage(messageKey, true);
      const cleanQueueName = queueName.replace(/^queue-/, "");

      const result = await window.electronAPI.sendMessage(cleanQueueName, message);
      if (!result.success) {
        throw new Error(result.error || "Failed to send message");
      }

      // Refresh the messages after successful resend
      await handlePeekMessages(cleanQueueName);
    } catch (error) {
      console.error("Failed to resend message:", error);
    } finally {
      setResendingMessage(messageKey, false);
    }
  };

  const handlePeekMessages = async (queueName: string) => {
    try {
      setIsLoadingMessages(true);
      const cleanQueueName = queueName.replace(/^queue-/, "");

      const result = await window.electronAPI.peekQueueMessages(cleanQueueName, 10, 0);

      if (!result.success) {
        if (result.error?.includes("connection") && lastConnectionString) {
          await window.electronAPI.connectServiceBus(lastConnectionString);
          const retryResult = await window.electronAPI.peekQueueMessages(cleanQueueName, 10, 0);
          if (!retryResult.success) {
            throw new Error(retryResult.error || "Failed to peek messages after reconnection");
          }
          if (retryResult.data) {
            setMessages(
              retryResult.data.map((msg) => ({
                ...msg,
                enqueuedTime: msg.enqueuedTime ? new Date(msg.enqueuedTime) : undefined,
              }))
            );
            return;
          }
        }
        throw new Error(result.error || "Failed to peek messages");
      }

      setMessages(
        (result.data || []).map((msg) => ({
          ...msg,
          enqueuedTime: msg.enqueuedTime ? new Date(msg.enqueuedTime) : undefined,
        }))
      );
    } catch (error) {
      console.error("Failed to peek messages:", error);
      setMessages([]);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handlePeekDlqMessages = async (queueName: string) => {
    try {
      setIsLoadingDlqMessages(true);
      const cleanQueueName = queueName.replace(/^queue-/, "");

      const result = await window.electronAPI.peekQueueDeadLetterMessages(cleanQueueName, 10);

      if (!result.success) {
        throw new Error(result.error || "Failed to peek DLQ messages");
      }

      setDlqMessages(
        (result.data || []).map((msg) => ({
          ...msg,
          enqueuedTime: msg.enqueuedTime ? new Date(msg.enqueuedTime) : undefined,
        }))
      );
    } catch (error) {
      console.error("Failed to peek DLQ messages:", error);
      setDlqMessages([]);
    } finally {
      setIsLoadingDlqMessages(false);
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

  return {
    isConnected,
    namespaceInfo,
    error,
    isLoading,
    messages,
    isLoadingMessages,
    dlqMessages,
    isLoadingDlqMessages,
    resendingMessage,
    handleConnect,
    handleDisconnect,
    handlePeekMessages,
    handlePeekDlqMessages,
    handleResendMessage,
  };
};

import { ipcMain } from "electron";
import { ServiceBusManager, ServiceBusMessage } from "./serviceBus";

export function setupIpcHandlers() {
  const serviceBus = new ServiceBusManager();

  ipcMain.handle("connect-service-bus", async (_, connectionString: string) => {
    try {
      const result = await serviceBus.connect(connectionString);
      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });

  ipcMain.handle("list-queues", async () => {
    try {
      const queues = await serviceBus.listQueues();
      return { success: true, data: queues };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });

  ipcMain.handle("list-topics", async () => {
    try {
      const topics = await serviceBus.listTopics();
      return { success: true, data: topics };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });

  ipcMain.handle("list-subscriptions", async (_, topicName: string) => {
    try {
      const subscriptions = await serviceBus.listSubscriptions(topicName);
      return { success: true, data: subscriptions };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });

  ipcMain.handle("peek-queue-messages", async (_, queueName: string, maxMessages?: number) => {
    try {
      const messages = await serviceBus.peekQueueMessages(queueName, maxMessages);
      return { success: true, data: messages };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });

  ipcMain.handle(
    "peek-subscription-messages",
    async (_, topicName: string, subscriptionName: string, maxMessages?: number) => {
      try {
        const messages = await serviceBus.peekSubscriptionMessages(
          topicName,
          subscriptionName,
          maxMessages
        );
        return { success: true, data: messages };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }
  );

  ipcMain.handle("peek-queue-dlq-messages", async (_, queueName: string, maxMessages?: number) => {
    try {
      const messages = await serviceBus.peekQueueDeadLetterMessages(queueName, maxMessages);
      return { success: true, data: messages };
    } catch (error) {
      console.error("Failed to peek DLQ messages:", error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  });

  ipcMain.handle("send-message", async (_, queueName: string, message: ServiceBusMessage) => {
    try {
      await serviceBus.sendMessage(queueName, message);
      return { success: true };
    } catch (error) {
      console.error("Failed to send message:", error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  });

  ipcMain.handle(
    "delete-message",
    async (_, queueName: string, message: ServiceBusMessage, isDlq: boolean = false) => {
      try {
        await serviceBus.deleteMessage(queueName, message, isDlq);
        return { success: true };
      } catch (error) {
        console.error("Failed to delete message:", error);
        return { success: false, error: error instanceof Error ? error.message : String(error) };
      }
    }
  );

  ipcMain.handle("disconnect-service-bus", () => {
    serviceBus.disconnect();
    return { success: true };
  });
}

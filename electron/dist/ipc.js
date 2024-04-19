"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupIpcHandlers = setupIpcHandlers;
const electron_1 = require("electron");
const serviceBus_1 = require("./serviceBus");
function setupIpcHandlers() {
    const serviceBus = new serviceBus_1.ServiceBusManager();
    electron_1.ipcMain.handle("connect-service-bus", async (_, connectionString) => {
        try {
            const result = await serviceBus.connect(connectionString);
            return { success: true, data: result };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
            };
        }
    });
    electron_1.ipcMain.handle("list-queues", async () => {
        try {
            const queues = await serviceBus.listQueues();
            return { success: true, data: queues };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
            };
        }
    });
    electron_1.ipcMain.handle("list-topics", async () => {
        try {
            const topics = await serviceBus.listTopics();
            return { success: true, data: topics };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
            };
        }
    });
    electron_1.ipcMain.handle("list-subscriptions", async (_, topicName) => {
        try {
            const subscriptions = await serviceBus.listSubscriptions(topicName);
            return { success: true, data: subscriptions };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
            };
        }
    });
    electron_1.ipcMain.handle("peek-queue-messages", async (_, queueName, maxMessages) => {
        try {
            const messages = await serviceBus.peekQueueMessages(queueName, maxMessages);
            return { success: true, data: messages };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
            };
        }
    });
    electron_1.ipcMain.handle("peek-subscription-messages", async (_, topicName, subscriptionName, maxMessages) => {
        try {
            const messages = await serviceBus.peekSubscriptionMessages(topicName, subscriptionName, maxMessages);
            return { success: true, data: messages };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
            };
        }
    });
    electron_1.ipcMain.handle("peek-queue-dlq-messages", async (_, queueName, maxMessages) => {
        try {
            const messages = await serviceBus.peekQueueDeadLetterMessages(queueName, maxMessages);
            return { success: true, data: messages };
        }
        catch (error) {
            console.error("Failed to peek DLQ messages:", error);
            return { success: false, error: error instanceof Error ? error.message : String(error) };
        }
    });
    electron_1.ipcMain.handle("send-message", async (_, queueName, message) => {
        try {
            await serviceBus.sendMessage(queueName, message);
            return { success: true };
        }
        catch (error) {
            console.error("Failed to send message:", error);
            return { success: false, error: error instanceof Error ? error.message : String(error) };
        }
    });
    electron_1.ipcMain.handle("disconnect-service-bus", () => {
        serviceBus.disconnect();
        return { success: true };
    });
}

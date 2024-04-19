"use strict";
// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld("electronAPI", {
    connectServiceBus: (connectionString) => electron_1.ipcRenderer.invoke("connect-service-bus", connectionString),
    listQueues: () => electron_1.ipcRenderer.invoke("list-queues"),
    listTopics: () => electron_1.ipcRenderer.invoke("list-topics"),
    listSubscriptions: (topicName) => electron_1.ipcRenderer.invoke("list-subscriptions", topicName),
    peekQueueMessages: (queueName, maxMessages) => electron_1.ipcRenderer.invoke("peek-queue-messages", queueName, maxMessages),
    peekQueueDeadLetterMessages: (queueName, maxMessages) => electron_1.ipcRenderer.invoke("peek-queue-dlq-messages", queueName, maxMessages),
    peekSubscriptionMessages: (topicName, subscriptionName, maxMessages) => electron_1.ipcRenderer.invoke("peek-subscription-messages", topicName, subscriptionName, maxMessages),
    sendMessage: (queueName, message) => electron_1.ipcRenderer.invoke("send-message", queueName, message),
    disconnectServiceBus: () => electron_1.ipcRenderer.invoke("disconnect-service-bus"),
});

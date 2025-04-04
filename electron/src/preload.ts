// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  connectServiceBus: (connectionString: string) =>
    ipcRenderer.invoke("connect-service-bus", connectionString),

  listQueues: () => ipcRenderer.invoke("list-queues"),

  listTopics: () => ipcRenderer.invoke("list-topics"),

  listSubscriptions: (topicName: string) => ipcRenderer.invoke("list-subscriptions", topicName),

  peekQueueMessages: (queueName: string, maxMessages?: number) =>
    ipcRenderer.invoke("peek-queue-messages", queueName, maxMessages),

  peekQueueDeadLetterMessages: (queueName: string, maxMessages?: number) =>
    ipcRenderer.invoke("peek-queue-dlq-messages", queueName, maxMessages),

  peekSubscriptionMessages: (topicName: string, subscriptionName: string, maxMessages?: number) =>
    ipcRenderer.invoke("peek-subscription-messages", topicName, subscriptionName, maxMessages),

  sendMessage: (queueName: string, message: any) =>
    ipcRenderer.invoke("send-message", queueName, message),

  deleteMessage: (queueName: string, message: any, isDlq: boolean = false) =>
    ipcRenderer.invoke("delete-message", queueName, message, isDlq),

  disconnectServiceBus: () => ipcRenderer.invoke("disconnect-service-bus"),
});

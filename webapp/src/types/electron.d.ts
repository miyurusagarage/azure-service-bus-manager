interface ServiceBusMessage {
  messageId?: string;
  body: any;
  contentType?: string;
  correlationId?: string;
  subject?: string;
  to?: string;
  replyTo?: string;
  replyToSessionId?: string;
  sessionId?: string;
  timeToLive?: number;
  enqueuedTime?: Date;
  sequenceNumber?: bigint;
}

interface QueueInfo {
  name: string;
  messageCount: number;
  activeMessageCount: number;
  deadLetterCount: number;
}

interface ElectronAPI {
  connectServiceBus: (connectionString: string) => Promise<{
    success: boolean;
    data?: { name: string; endpoint: string };
    error?: string;
  }>;
  disconnectServiceBus: () => Promise<void>;
  listQueues: () => Promise<{
    success: boolean;
    data?: QueueInfo[];
    error?: string;
  }>;
  listTopics: () => Promise<{
    success: boolean;
    data?: string[];
    error?: string;
  }>;
  listSubscriptions: (
    topicName: string
  ) => Promise<{ success: boolean; data?: string[]; error?: string }>;
  peekQueueMessages: (
    queueName: string,
    maxMessages?: number
  ) => Promise<{ success: boolean; data?: ServiceBusMessage[]; error?: string }>;
  peekQueueDeadLetterMessages: (
    queueName: string,
    maxMessages?: number
  ) => Promise<{ success: boolean; data?: ServiceBusMessage[]; error?: string }>;
  peekSubscriptionMessages: (
    topicName: string,
    subscriptionName: string,
    maxMessages?: number
  ) => Promise<{ success: boolean; data?: ServiceBusMessage[]; error?: string }>;
  sendMessage: (
    queueName: string,
    message: ServiceBusMessage
  ) => Promise<{ success: boolean; error?: string }>;
  deleteMessage: (
    queueName: string,
    message: ServiceBusMessage,
    isDlq?: boolean
  ) => Promise<{ success: boolean; error?: string }>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};

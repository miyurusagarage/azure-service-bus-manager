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

interface QueueOptions {
  maxSizeInGB?: number;
  messageTimeToLive?: string; // ISO 8601 duration format
  lockDuration?: string; // ISO 8601 duration format
  enablePartitioning?: boolean;
  enableDeadLetteringOnMessageExpiration?: boolean;
  requiresSession?: boolean;
  maxDeliveryCount?: number;
  enableDuplicateDetection?: boolean;
  duplicateDetectionHistoryTimeWindow?: string; // ISO 8601 duration format
  enableBatchedOperations?: boolean;
}

interface TopicOptions {
  maxSizeInGB?: number;
  defaultMessageTimeToLive?: string; // ISO 8601 duration format
  enablePartitioning?: boolean;
  enableDuplicateDetection?: boolean;
  duplicateDetectionHistoryTimeWindow?: string; // ISO 8601 duration format
  enableBatchedOperations?: boolean;
  supportOrdering?: boolean;
  autoDeleteOnIdle?: string; // ISO 8601 duration format
}

interface SubscriptionOptions {
  lockDuration?: string; // ISO 8601 duration format
  defaultMessageTimeToLive?: string; // ISO 8601 duration format
  enableDeadLetteringOnMessageExpiration?: boolean;
  maxDeliveryCount?: number;
  enableBatchedOperations?: boolean;
  requiresSession?: boolean;
  autoDeleteOnIdle?: string; // ISO 8601 duration format
  forwardTo?: string;
  forwardDeadLetteredMessagesTo?: string;
  sqlFilter?: string;
  correlationFilter?: {
    correlationId?: string;
    messageId?: string;
    to?: string;
    replyTo?: string;
    label?: string;
    sessionId?: string;
    replyToSessionId?: string;
    contentType?: string;
    userProperties?: Record<string, any>;
  };
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
  createQueue: (
    queueName: string,
    options?: QueueOptions
  ) => Promise<{ success: boolean; error?: string }>;
  createTopic: (
    topicName: string,
    options?: TopicOptions
  ) => Promise<{ success: boolean; error?: string }>;
  createSubscription: (
    topicName: string,
    subscriptionName: string,
    options?: SubscriptionOptions
  ) => Promise<{ success: boolean; error?: string }>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};

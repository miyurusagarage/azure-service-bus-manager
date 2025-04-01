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
    data?: Array<{ name: string; activeMessageCount: number; messageCount: number }>;
    error?: string;
  }>;
  listTopics: () => Promise<{
    success: boolean;
    data?: string[];
    error?: string;
  }>;
  peekQueueMessages: (
    queueName: string,
    count: number,
    fromSequenceNumber: number
  ) => Promise<{
    success: boolean;
    data?: Array<{
      messageId?: string;
      body: any;
      contentType?: string;
      correlationId?: string;
      subject?: string;
      sessionId?: string;
      enqueuedTime?: string;
      sequenceNumber?: bigint;
    }>;
    error?: string;
  }>;
  peekQueueDeadLetterMessages: (
    queueName: string,
    count: number
  ) => Promise<{
    success: boolean;
    data?: Array<{
      messageId?: string;
      body: any;
      contentType?: string;
      correlationId?: string;
      subject?: string;
      sessionId?: string;
      enqueuedTime?: string;
      sequenceNumber?: bigint;
    }>;
    error?: string;
  }>;
  sendMessage: (
    queueName: string,
    message: {
      messageId?: string;
      body: any;
      contentType?: string;
      correlationId?: string;
      subject?: string;
      sessionId?: string;
    }
  ) => Promise<{
    success: boolean;
    error?: string;
  }>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};

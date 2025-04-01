export interface ServiceBusError {
  message: string;
  details?: string;
}

export interface ServiceBusMessage {
  messageId?: string;
  body: any;
  contentType?: string;
  correlationId?: string;
  subject?: string;
  label?: string;
  to?: string;
  replyTo?: string;
  replyToSessionId?: string;
  sessionId?: string;
  timeToLive?: number;
  enqueuedTime?: Date;
  sequenceNumber?: bigint;
  applicationProperties?: { [key: string]: any };
  systemProperties?: { [key: string]: any };
}

export interface QueueInfo {
  name: string;
  activeMessageCount: number;
  messageCount: number;
}

export interface TreeItem {
  title: string | React.ReactNode;
  key: string;
  icon?: React.ReactNode;
  children?: TreeItem[];
}

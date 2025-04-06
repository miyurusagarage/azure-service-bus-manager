import {
  ServiceBusClient,
  ServiceBusAdministrationClient,
  ServiceBusReceivedMessage,
  QueueRuntimeProperties,
  delay,
  ServiceBusReceiver,
} from "@azure/service-bus";
import Long from "long";

interface ServiceBusError {
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

interface QueueInfo {
  name: string;
  messageCount: number;
  activeMessageCount: number;
  deadLetterCount: number;
}

function convertMessage(msg: ServiceBusReceivedMessage): ServiceBusMessage {
  const headers = (msg as any).headers || (msg as any).message?.header || {};

  return {
    messageId: msg.messageId?.toString(),
    body: msg.body,
    contentType: msg.contentType || "text/plain",
    correlationId: msg.correlationId?.toString(),
    subject: msg.subject,
    to: msg.to,
    replyTo: msg.replyTo,
    replyToSessionId: msg.replyToSessionId,
    sessionId: msg.sessionId,
    timeToLive: msg.timeToLive,
    enqueuedTime: msg.enqueuedTimeUtc,
    sequenceNumber: msg.sequenceNumber ? BigInt(msg.sequenceNumber.toString()) : undefined,
    applicationProperties: msg.applicationProperties,
    systemProperties: {
      ...msg.applicationProperties,
      headers,
    },
  };
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error("Connection timed out. Please check your internet connection."));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]);
}

function getServiceBusErrorMessage(error: unknown): ServiceBusError {
  if (error instanceof Error) {
    // First try to parse if it's already a JSON error
    try {
      const parsed = JSON.parse(error.message);
      if (parsed.message) {
        return parsed;
      }
    } catch (e) {
      // Not a JSON error, continue with normal error handling
    }

    // Check for specific Azure Service Bus error patterns
    const message = error.message.toLowerCase();
    if (message.includes("timeout")) {
      return {
        message: "Connection timed out. Please check your internet connection.",
        details: error.message,
      };
    }
    if (message.includes("unauthorized") || message.includes("401")) {
      return {
        message:
          "Authentication failed. Please check your connection string and ensure you have the necessary permissions.",
        details: error.message,
      };
    }
    if (message.includes("network") || message.includes("enotfound")) {
      return {
        message: "Network error. Please check your internet connection and VPN settings.",
        details: error.message,
      };
    }
    return {
      message: "Service Bus Error",
      details: error.message,
    };
  }
  return {
    message: "An unknown error occurred",
  };
}

export class ServiceBusManager {
  private client: ServiceBusClient | null = null;
  private adminClient: ServiceBusAdministrationClient | null = null;

  async connect(connectionString: string): Promise<{ name: string; endpoint: string }> {
    try {
      // Extract namespace info from connection string first
      const match = connectionString.match(/Endpoint=sb:\/\/([^.]+)\.servicebus\.windows\.net/);
      if (!match) {
        throw new Error("Invalid connection string format");
      }

      const name = match[1];
      const endpoint = `sb://${name}.servicebus.windows.net/`;

      // Quick connection test with 3-second timeout
      await withTimeout(
        fetch(`https://${name}.servicebus.windows.net/`, {
          method: "HEAD",
        }),
        3000
      );

      // If connection test passes, initialize clients
      this.client = new ServiceBusClient(connectionString);
      this.adminClient = new ServiceBusAdministrationClient(connectionString);

      // Verify Service Bus access
      await this.adminClient.listQueues().next();

      return { name, endpoint };
    } catch (error) {
      this.client = null;
      this.adminClient = null;
      const serviceBusError = getServiceBusErrorMessage(error);
      throw new Error(JSON.stringify(serviceBusError));
    }
  }

  async listQueues(): Promise<QueueInfo[]> {
    if (!this.adminClient) {
      throw new Error(JSON.stringify({ message: "Not connected to Service Bus" }));
    }

    try {
      const queues = [];
      for await (const queue of this.adminClient.listQueues()) {
        if (queue.name) {
          try {
            const runtime = await this.adminClient.getQueueRuntimeProperties(queue.name);
            queues.push({
              name: queue.name,
              messageCount: runtime.totalMessageCount ?? 0,
              activeMessageCount: runtime.activeMessageCount ?? 0,
              deadLetterCount: runtime.deadLetterMessageCount ?? 0,
            });
          } catch (error) {
            console.error(`Error getting runtime properties for queue ${queue.name}:`, error);
            queues.push({
              name: queue.name,
              messageCount: 0,
              activeMessageCount: 0,
              deadLetterCount: 0,
            });
          }
        }
      }
      return queues;
    } catch (error) {
      console.error("Error listing queues:", error);
      const serviceBusError = getServiceBusErrorMessage(error);
      throw new Error(JSON.stringify(serviceBusError));
    }
  }

  async listTopics(): Promise<string[]> {
    if (!this.adminClient) {
      throw new Error(JSON.stringify({ message: "Not connected to Service Bus" }));
    }

    try {
      const topics = [];
      for await (const topic of this.adminClient.listTopics()) {
        if (topic.name) {
          topics.push(topic.name);
        }
      }
      return topics;
    } catch (error) {
      console.error("Error listing topics:", error);
      const serviceBusError = getServiceBusErrorMessage(error);
      throw new Error(JSON.stringify(serviceBusError));
    }
  }

  async createQueue(queueName: string, options?: any): Promise<void> {
    if (!this.adminClient) {
      throw new Error(JSON.stringify({ message: "Not connected to Service Bus" }));
    }

    try {
      await this.adminClient.createQueue(queueName, {
        maxSizeInMegabytes: options?.maxSizeInGB ? options.maxSizeInGB * 1024 : undefined,
        defaultMessageTimeToLive: options?.messageTimeToLive,
        lockDuration: options?.lockDuration,
        enablePartitioning: options?.enablePartitioning,
        deadLetteringOnMessageExpiration: options?.enableDeadLetteringOnMessageExpiration,
        requiresSession: options?.requiresSession,
        maxDeliveryCount: options?.maxDeliveryCount,
        requiresDuplicateDetection: options?.enableDuplicateDetection,
        duplicateDetectionHistoryTimeWindow: options?.duplicateDetectionHistoryTimeWindow,
        enableBatchedOperations: options?.enableBatchedOperations,
      });
    } catch (error) {
      console.error("Error creating queue:", error);
      const serviceBusError = getServiceBusErrorMessage(error);
      throw new Error(JSON.stringify(serviceBusError));
    }
  }

  async createTopic(topicName: string, options?: any): Promise<void> {
    if (!this.adminClient) {
      throw new Error(JSON.stringify({ message: "Not connected to Service Bus" }));
    }

    try {
      await this.adminClient.createTopic(topicName, {
        maxSizeInMegabytes: options?.maxSizeInGB ? options.maxSizeInGB * 1024 : undefined,
        defaultMessageTimeToLive: options?.defaultMessageTimeToLive,
        enablePartitioning: options?.enablePartitioning,
        requiresDuplicateDetection: options?.enableDuplicateDetection,
        duplicateDetectionHistoryTimeWindow: options?.duplicateDetectionHistoryTimeWindow,
        enableBatchedOperations: options?.enableBatchedOperations,
        supportOrdering: options?.supportOrdering,
        autoDeleteOnIdle: options?.autoDeleteOnIdle,
      });
    } catch (error) {
      console.error("Error creating topic:", error);
      const serviceBusError = getServiceBusErrorMessage(error);
      throw new Error(JSON.stringify(serviceBusError));
    }
  }

  async createSubscription(topicName: string, subscriptionName: string): Promise<void> {
    if (!this.adminClient) {
      throw new Error(JSON.stringify({ message: "Not connected to Service Bus" }));
    }

    try {
      await this.adminClient.createSubscription(topicName, subscriptionName);
    } catch (error) {
      console.error("Error creating subscription:", error);
      const serviceBusError = getServiceBusErrorMessage(error);
      throw new Error(JSON.stringify(serviceBusError));
    }
  }

  async listSubscriptions(topicName: string): Promise<string[]> {
    if (!this.adminClient) {
      throw new Error(JSON.stringify({ message: "Not connected to Service Bus" }));
    }

    try {
      const subscriptions = [];
      for await (const subscription of this.adminClient.listSubscriptions(topicName)) {
        if (subscription.subscriptionName) {
          subscriptions.push(subscription.subscriptionName);
        }
      }
      return subscriptions;
    } catch (error) {
      console.error("Error listing subscriptions:", error);
      const serviceBusError = getServiceBusErrorMessage(error);
      throw new Error(JSON.stringify(serviceBusError));
    }
  }

  async peekQueueMessages(
    queueName: string,
    maxMessages: number = 10
  ): Promise<ServiceBusMessage[]> {
    if (!this.client) {
      throw new Error(JSON.stringify({ message: "Not connected to Service Bus" }));
    }

    let receiver = null;
    try {
      // Create a new receiver
      receiver = this.client.createReceiver(queueName, {
        receiveMode: "peekLock",
        skipParsingBodyAsJson: false,
      });
      console.log("Created new receiver for queue:", queueName);

      // Add a small delay to ensure the receiver is ready
      await delay(100);

      // Peek messages from the beginning using Long.fromNumber
      const messages = await receiver.peekMessages(maxMessages, {
        fromSequenceNumber: Long.fromNumber(1),
      });
      console.log(`Peeked ${messages.length} messages from queue:`, queueName);

      // Convert messages
      const convertedMessages = messages.map(convertMessage);
      return convertedMessages;
    } catch (error) {
      console.error("Error peeking queue messages:", error);
      const serviceBusError = getServiceBusErrorMessage(error);
      throw new Error(JSON.stringify(serviceBusError));
    } finally {
      // Always close the receiver in the finally block
      if (receiver) {
        try {
          await receiver.close();
          console.log("Closed receiver for queue:", queueName);
        } catch (closeError) {
          console.error("Error closing receiver:", closeError);
        }
      }
    }
  }

  async peekSubscriptionMessages(
    topicName: string,
    subscriptionName: string,
    maxMessages: number = 10
  ): Promise<ServiceBusMessage[]> {
    if (!this.client) {
      throw new Error(JSON.stringify({ message: "Not connected to Service Bus" }));
    }

    let receiver = null;
    try {
      receiver = this.client.createReceiver(topicName, subscriptionName, {
        receiveMode: "peekLock",
      });
      console.log("Created new receiver for subscription:", subscriptionName);

      // Add a small delay to ensure the receiver is ready
      await delay(100);

      // Peek messages from the beginning using Long.fromNumber
      const messages = await receiver.peekMessages(maxMessages, {
        fromSequenceNumber: Long.fromNumber(1),
      });
      console.log(`Peeked ${messages.length} messages from subscription:`, subscriptionName);

      return messages.map(convertMessage);
    } catch (error) {
      console.error("Error peeking subscription messages:", error);
      const serviceBusError = getServiceBusErrorMessage(error);
      throw new Error(JSON.stringify(serviceBusError));
    } finally {
      if (receiver) {
        try {
          await receiver.close();
          console.log("Closed receiver for subscription:", subscriptionName);
        } catch (closeError) {
          console.error("Error closing receiver:", closeError);
        }
      }
    }
  }

  async peekQueueDeadLetterMessages(
    queueName: string,
    maxMessages: number = 10
  ): Promise<ServiceBusMessage[]> {
    if (!this.client) {
      throw new Error(JSON.stringify({ message: "Not connected to Service Bus" }));
    }

    let receiver = null;
    try {
      // Create a new receiver for the dead letter sub-queue
      receiver = this.client.createReceiver(queueName, {
        receiveMode: "peekLock",
        skipParsingBodyAsJson: false,
        subQueueType: "deadLetter",
      });
      console.log("Created new DLQ receiver for queue:", queueName);

      // Add a small delay to ensure the receiver is ready
      await delay(100);

      // Peek messages from the beginning using Long.fromNumber
      const messages = await receiver.peekMessages(maxMessages, {
        fromSequenceNumber: Long.fromNumber(1),
      });
      console.log(`Peeked ${messages.length} DLQ messages from queue:`, queueName);

      // Convert messages
      const convertedMessages = messages.map(convertMessage);
      return convertedMessages;
    } catch (error) {
      console.error("Error peeking DLQ messages:", error);
      const serviceBusError = getServiceBusErrorMessage(error);
      throw new Error(JSON.stringify(serviceBusError));
    } finally {
      // Always close the receiver in the finally block
      if (receiver) {
        try {
          await receiver.close();
          console.log("Closed DLQ receiver for queue:", queueName);
        } catch (closeError) {
          console.error("Error closing DLQ receiver:", closeError);
        }
      }
    }
  }

  async sendMessage(queueName: string, message: ServiceBusMessage): Promise<void> {
    if (!this.client) {
      throw new Error(JSON.stringify({ message: "Not connected to Service Bus" }));
    }

    let sender = null;
    try {
      sender = this.client.createSender(queueName);
      console.log("Created new sender for queue:", queueName);

      // Prepare the message
      const { body, ...properties } = message;
      const sendMessage = {
        body,
        contentType: properties.contentType,
        correlationId: properties.correlationId,
        subject: properties.subject,
        messageId: properties.messageId,
        sessionId: properties.sessionId,
        timeToLive: properties.timeToLive,
        applicationProperties: properties.applicationProperties,
      };

      // Send the message
      await sender.sendMessages(sendMessage);
      console.log("Message sent to queue:", queueName);
    } catch (error) {
      console.error("Error sending message:", error);
      const serviceBusError = getServiceBusErrorMessage(error);
      throw new Error(JSON.stringify(serviceBusError));
    } finally {
      if (sender) {
        try {
          await sender.close();
          console.log("Closed sender for queue:", queueName);
        } catch (closeError) {
          console.error("Error closing sender:", closeError);
        }
      }
    }
  }

  async deleteMessage(
    queueName: string,
    message: ServiceBusMessage,
    isDlq: boolean = false
  ): Promise<void> {
    if (!this.client) {
      throw new Error(JSON.stringify({ message: "Not connected to Service Bus" }));
    }

    if (!message.sequenceNumber) {
      throw new Error(JSON.stringify({ message: "Message has no sequence number" }));
    }

    let receiver: ServiceBusReceiver | null = null;
    try {
      // Create a receiver in peekLock mode
      receiver = this.client.createReceiver(queueName, {
        receiveMode: "peekLock",
        skipParsingBodyAsJson: false,
        ...(isDlq ? { subQueueType: "deadLetter" } : {}),
      });

      // Add a small delay to ensure the receiver is ready
      await delay(100);

      // First peek the message to confirm it exists
      const peekedMessages = await receiver.peekMessages(1, {
        fromSequenceNumber: Long.fromString(message.sequenceNumber.toString()),
      });

      if (peekedMessages.length === 0) {
        throw new Error(
          `Message with sequence number ${message.sequenceNumber.toString()} not found`
        );
      }

      // Now receive messages until we find our target
      let targetMessage = null;
      let attempts = 0;
      const maxAttempts = 5;

      while (!targetMessage && attempts < maxAttempts) {
        const messages = await receiver.receiveMessages(5, { maxWaitTimeInMs: 2000 });

        // Find our target message
        targetMessage = messages.find(
          (msg) => msg.sequenceNumber?.toString() === message.sequenceNumber?.toString()
        );

        // Abandon messages that aren't our target
        await Promise.all(
          messages
            .filter((msg) => msg.sequenceNumber?.toString() !== message.sequenceNumber?.toString())
            .map((msg) => receiver!.abandonMessage(msg))
        );

        if (targetMessage) {
          break;
        }

        attempts++;
      }

      if (!targetMessage) {
        throw new Error(
          `Message with sequence number ${message.sequenceNumber.toString()} could not be received after ${maxAttempts} attempts`
        );
      }

      // Complete (delete) the specific message
      await receiver.completeMessage(targetMessage);

      console.log(
        `Message deleted from ${isDlq ? "DLQ" : "queue"}:`,
        queueName,
        "sequence number:",
        message.sequenceNumber?.toString()
      );
    } catch (error) {
      console.error("Error deleting message:", error);
      const serviceBusError = getServiceBusErrorMessage(error);
      throw new Error(JSON.stringify(serviceBusError));
    } finally {
      if (receiver) {
        try {
          await receiver.close();
          console.log(`Closed receiver for ${isDlq ? "DLQ" : "queue"}:`, queueName);
        } catch (closeError) {
          console.error("Error closing receiver:", closeError);
        }
      }
    }
  }

  disconnect(): void {
    if (this.client) {
      this.client.close();
      this.client = null;
    }
    this.adminClient = null;
  }
}

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceBusManager = void 0;
const service_bus_1 = require("@azure/service-bus");
const long_1 = __importDefault(require("long"));
function convertMessage(msg) {
    const headers = msg.headers || msg.message?.header || {};
    return {
        messageId: msg.messageId?.toString(),
        body: msg.body,
        contentType: msg.contentType,
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
async function withTimeout(promise, timeoutMs) {
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
            reject(new Error("Connection timed out. Please check your internet connection."));
        }, timeoutMs);
    });
    return Promise.race([promise, timeoutPromise]);
}
function getServiceBusErrorMessage(error) {
    if (error instanceof Error) {
        // First try to parse if it's already a JSON error
        try {
            const parsed = JSON.parse(error.message);
            if (parsed.message) {
                return parsed;
            }
        }
        catch (e) {
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
                message: "Authentication failed. Please check your connection string and ensure you have the necessary permissions.",
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
class ServiceBusManager {
    constructor() {
        this.client = null;
        this.adminClient = null;
    }
    async connect(connectionString) {
        try {
            // Extract namespace info from connection string first
            const match = connectionString.match(/Endpoint=sb:\/\/([^.]+)\.servicebus\.windows\.net/);
            if (!match) {
                throw new Error("Invalid connection string format");
            }
            const name = match[1];
            const endpoint = `sb://${name}.servicebus.windows.net/`;
            // Quick connection test with 3-second timeout
            await withTimeout(fetch(`https://${name}.servicebus.windows.net/`, {
                method: "HEAD",
            }), 3000);
            // If connection test passes, initialize clients
            this.client = new service_bus_1.ServiceBusClient(connectionString);
            this.adminClient = new service_bus_1.ServiceBusAdministrationClient(connectionString);
            // Verify Service Bus access
            await this.adminClient.listQueues().next();
            return { name, endpoint };
        }
        catch (error) {
            this.client = null;
            this.adminClient = null;
            const serviceBusError = getServiceBusErrorMessage(error);
            throw new Error(JSON.stringify(serviceBusError));
        }
    }
    async listQueues() {
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
                    }
                    catch (error) {
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
        }
        catch (error) {
            console.error("Error listing queues:", error);
            const serviceBusError = getServiceBusErrorMessage(error);
            throw new Error(JSON.stringify(serviceBusError));
        }
    }
    async listTopics() {
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
        }
        catch (error) {
            console.error("Error listing topics:", error);
            const serviceBusError = getServiceBusErrorMessage(error);
            throw new Error(JSON.stringify(serviceBusError));
        }
    }
    async listSubscriptions(topicName) {
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
        }
        catch (error) {
            console.error("Error listing subscriptions:", error);
            const serviceBusError = getServiceBusErrorMessage(error);
            throw new Error(JSON.stringify(serviceBusError));
        }
    }
    async peekQueueMessages(queueName, maxMessages = 10) {
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
            await (0, service_bus_1.delay)(100);
            // Peek messages from the beginning using Long.fromNumber
            const messages = await receiver.peekMessages(maxMessages, {
                fromSequenceNumber: long_1.default.fromNumber(1),
            });
            console.log(`Peeked ${messages.length} messages from queue:`, queueName);
            // Convert messages
            const convertedMessages = messages.map(convertMessage);
            return convertedMessages;
        }
        catch (error) {
            console.error("Error peeking queue messages:", error);
            const serviceBusError = getServiceBusErrorMessage(error);
            throw new Error(JSON.stringify(serviceBusError));
        }
        finally {
            // Always close the receiver in the finally block
            if (receiver) {
                try {
                    await receiver.close();
                    console.log("Closed receiver for queue:", queueName);
                }
                catch (closeError) {
                    console.error("Error closing receiver:", closeError);
                }
            }
        }
    }
    async peekSubscriptionMessages(topicName, subscriptionName, maxMessages = 10) {
        if (!this.client) {
            throw new Error(JSON.stringify({ message: "Not connected to Service Bus" }));
        }
        try {
            const receiver = this.client.createReceiver(topicName, subscriptionName, {
                receiveMode: "peekLock",
            });
            const messages = await receiver.peekMessages(maxMessages);
            await receiver.close();
            return messages.map(convertMessage);
        }
        catch (error) {
            console.error("Error peeking subscription messages:", error);
            const serviceBusError = getServiceBusErrorMessage(error);
            throw new Error(JSON.stringify(serviceBusError));
        }
    }
    async peekQueueDeadLetterMessages(queueName, maxMessages = 10) {
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
            await (0, service_bus_1.delay)(100);
            // Peek messages from the beginning using Long.fromNumber
            const messages = await receiver.peekMessages(maxMessages, {
                fromSequenceNumber: long_1.default.fromNumber(1),
            });
            console.log(`Peeked ${messages.length} DLQ messages from queue:`, queueName);
            // Convert messages
            const convertedMessages = messages.map(convertMessage);
            return convertedMessages;
        }
        catch (error) {
            console.error("Error peeking DLQ messages:", error);
            const serviceBusError = getServiceBusErrorMessage(error);
            throw new Error(JSON.stringify(serviceBusError));
        }
        finally {
            // Always close the receiver in the finally block
            if (receiver) {
                try {
                    await receiver.close();
                    console.log("Closed DLQ receiver for queue:", queueName);
                }
                catch (closeError) {
                    console.error("Error closing DLQ receiver:", closeError);
                }
            }
        }
    }
    async sendMessage(queueName, message) {
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
        }
        catch (error) {
            console.error("Error sending message:", error);
            const serviceBusError = getServiceBusErrorMessage(error);
            throw new Error(JSON.stringify(serviceBusError));
        }
        finally {
            if (sender) {
                try {
                    await sender.close();
                    console.log("Closed sender for queue:", queueName);
                }
                catch (closeError) {
                    console.error("Error closing sender:", closeError);
                }
            }
        }
    }
    disconnect() {
        if (this.client) {
            this.client.close();
            this.client = null;
        }
        this.adminClient = null;
    }
}
exports.ServiceBusManager = ServiceBusManager;

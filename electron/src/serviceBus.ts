import { ServiceBusClient, ServiceBusAdministrationClient } from "@azure/service-bus";

interface ServiceBusError {
  message: string;
  details?: string;
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

  async listQueues(): Promise<string[]> {
    if (!this.adminClient) {
      throw new Error(JSON.stringify({ message: "Not connected to Service Bus" }));
    }

    try {
      const queues = [];
      for await (const queue of this.adminClient.listQueues()) {
        if (queue.name) {
          queues.push(queue.name);
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

  disconnect(): void {
    if (this.client) {
      this.client.close();
      this.client = null;
    }
    this.adminClient = null;
  }
}

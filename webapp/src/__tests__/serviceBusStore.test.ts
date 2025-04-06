import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { useServiceBusStore } from "../stores/serviceBusStore";
import type { ServiceBusMessage, QueueInfo } from "../types/serviceBus";

interface NamespaceInfo {
  name: string;
  endpoint: string;
  queues: QueueInfo[];
  topics: string[];
}

describe("serviceBusStore", () => {
  let store: ReturnType<typeof useServiceBusStore.getState>;
  let storeSubscription: () => void;

  beforeEach(() => {
    store = useServiceBusStore.getState();
    storeSubscription = useServiceBusStore.subscribe((state) => {
      store = state;
    });
    store.resetState();
  });

  afterEach(() => {
    storeSubscription();
  });

  it("initializes with default state", () => {
    expect(store.isConnected).toBe(false);
    expect(store.namespaceInfo).toBeNull();
    expect(store.error).toBeNull();
    expect(store.isLoading).toBe(false);
    expect(store.lastConnectionString).toBeNull();
    expect(store.selectedNode).toBeNull();
    expect(store.searchTerm).toBe("");
    expect(store.messages).toEqual([]);
    expect(store.dlqMessages).toEqual([]);
    expect(store.selectedMessage).toBeNull();
    expect(store.deletingMessage).toEqual({});
    expect(store.resendingMessage).toEqual({});
    expect(store.viewMode).toBe("peek");
    expect(store.isLoadingMessages).toBe(false);
    expect(store.isLoadingDlqMessages).toBe(false);
  });

  it("updates connection state", () => {
    store.setConnected(true);
    expect(store.isConnected).toBe(true);

    store.setConnected(false);
    expect(store.isConnected).toBe(false);
  });

  it("updates namespace info", () => {
    const mockNamespaceInfo: NamespaceInfo = {
      name: "test-namespace",
      endpoint: "test-endpoint",
      queues: [
        {
          name: "test-queue",
          activeMessageCount: 1,
          messageCount: 1,
          deadLetterCount: 0,
        },
      ],
      topics: ["test-topic"],
    };

    store.setNamespaceInfo(mockNamespaceInfo);
    expect(store.namespaceInfo).toEqual(mockNamespaceInfo);
  });

  it("handles message operations", () => {
    const mockMessages: ServiceBusMessage[] = [
      {
        messageId: "test-id",
        body: { test: "data" },
        sequenceNumber: BigInt(1),
        enqueuedTime: new Date(),
        contentType: "application/json",
      },
    ];

    store.setMessages(mockMessages);
    expect(store.messages).toEqual(mockMessages);
    expect(store.deletingMessage).toEqual({});

    store.setDlqMessages(mockMessages);
    expect(store.dlqMessages).toEqual(mockMessages);
    expect(store.deletingMessage).toEqual({});
  });

  it("handles message deletion state", () => {
    const messageKey = "msg-1";

    store.setDeletingMessage(messageKey, true);
    expect(store.deletingMessage[messageKey]).toBe(true);

    store.setDeletingMessage(messageKey, false);
    expect(store.deletingMessage[messageKey]).toBe(false);
  });

  it("handles message resend state", () => {
    const messageKey = "msg-1";

    store.setResendingMessage(messageKey, true);
    expect(store.resendingMessage[messageKey]).toBe(true);

    store.setResendingMessage(messageKey, false);
    expect(store.resendingMessage[messageKey]).toBe(false);
  });

  it("handles view mode changes", () => {
    store.setViewMode("receive");
    expect(store.viewMode).toBe("receive");

    store.setViewMode("peek");
    expect(store.viewMode).toBe("peek");
  });

  it("handles error state", () => {
    const mockError = { message: "Test error" };

    store.setError(mockError);
    expect(store.error).toEqual(mockError);

    store.setError(null);
    expect(store.error).toBeNull();
  });

  it("handles loading state", () => {
    store.setLoading(true);
    expect(store.isLoading).toBe(true);

    store.setLoading(false);
    expect(store.isLoading).toBe(false);
  });

  it("handles message loading states", () => {
    store.setIsLoadingMessages(true);
    expect(store.isLoadingMessages).toBe(true);

    store.setIsLoadingDlqMessages(true);
    expect(store.isLoadingDlqMessages).toBe(true);

    store.setIsLoadingMessages(false);
    expect(store.isLoadingMessages).toBe(false);

    store.setIsLoadingDlqMessages(false);
    expect(store.isLoadingDlqMessages).toBe(false);
  });

  it("resets state correctly", () => {
    // Set some state
    store.setConnected(true);
    store.setNamespaceInfo({
      name: "test",
      endpoint: "test",
      queues: [],
      topics: [],
    });
    store.setMessages([{ messageId: "test", body: "test", sequenceNumber: BigInt(1) }]);
    store.setViewMode("receive");
    store.setError({ message: "test" });
    store.setLoading(true);
    store.setIsLoadingMessages(true);
    store.setIsLoadingDlqMessages(true);
    store.setDeletingMessage("test", true);
    store.setResendingMessage("test", true);

    // Reset state
    store.resetState();

    // Verify everything is reset
    expect(store.isConnected).toBe(false);
    expect(store.namespaceInfo).toBeNull();
    expect(store.error).toBeNull();
    expect(store.isLoading).toBe(false);
    expect(store.lastConnectionString).toBeNull();
    expect(store.selectedNode).toBeNull();
    expect(store.searchTerm).toBe("");
    expect(store.messages).toEqual([]);
    expect(store.dlqMessages).toEqual([]);
    expect(store.selectedMessage).toBeNull();
    expect(store.deletingMessage).toEqual({});
    expect(store.resendingMessage).toEqual({});
    expect(store.viewMode).toBe("peek");
    expect(store.isLoadingMessages).toBe(false);
    expect(store.isLoadingDlqMessages).toBe(false);
  });

  it("handles search term updates", () => {
    const searchTerm = "test search";

    store.setSearchTerm(searchTerm);
    expect(store.searchTerm).toBe(searchTerm);

    store.setSearchTerm("");
    expect(store.searchTerm).toBe("");
  });

  it("handles selected message updates", () => {
    const mockMessage: ServiceBusMessage = {
      messageId: "test-id",
      body: { test: "data" },
      sequenceNumber: BigInt(1),
      enqueuedTime: new Date(),
      contentType: "application/json",
    };

    store.setSelectedMessage(mockMessage);
    expect(store.selectedMessage).toEqual(mockMessage);

    store.setSelectedMessage(null);
    expect(store.selectedMessage).toBeNull();
  });

  it("handles last connection string updates", () => {
    const connectionString =
      "Endpoint=sb://test.servicebus.windows.net/;SharedAccessKeyName=test;SharedAccessKey=test";

    store.setLastConnectionString(connectionString);
    expect(store.lastConnectionString).toBe(connectionString);
  });

  it("handles selected node updates", () => {
    const node = "test-queue";

    store.setSelectedNode(node);
    expect(store.selectedNode).toBe(node);

    store.setSelectedNode(null);
    expect(store.selectedNode).toBeNull();
  });
});

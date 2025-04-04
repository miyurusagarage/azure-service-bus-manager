import { create } from "zustand";
import type { ServiceBusMessage, ServiceBusError, QueueInfo } from "../types/serviceBus";

interface NamespaceInfo {
  name: string;
  endpoint: string;
  queues: QueueInfo[];
  topics: string[];
}

interface ServiceBusState {
  // Connection state
  isConnected: boolean;
  namespaceInfo: NamespaceInfo | null;
  error: ServiceBusError | null;
  isLoading: boolean;
  lastConnectionString: string;

  // Queue/Topic selection
  selectedNode: string | null;
  searchTerm: string;

  // Messages
  messages: ServiceBusMessage[];
  isLoadingMessages: boolean;
  dlqMessages: ServiceBusMessage[];
  isLoadingDlqMessages: boolean;
  selectedMessage: ServiceBusMessage | null;
  deletingMessage: { [key: string]: boolean };
  resendingMessage: { [key: string]: boolean };

  // Actions
  setSelectedNode: (node: string | null) => void;
  setSearchTerm: (term: string) => void;
  setSelectedMessage: (message: ServiceBusMessage | null) => void;
  setMessages: (messages: ServiceBusMessage[]) => void;
  setDlqMessages: (messages: ServiceBusMessage[]) => void;
  setDeletingMessage: (key: string, value: boolean) => void;
  setResendingMessage: (key: string, value: boolean) => void;
  setError: (error: ServiceBusError | null) => void;
  setLoading: (loading: boolean) => void;
  setConnected: (connected: boolean) => void;
  setNamespaceInfo: (info: NamespaceInfo | null) => void;
  setLastConnectionString: (connectionString: string) => void;
  setIsLoadingMessages: (loading: boolean) => void;
  setIsLoadingDlqMessages: (loading: boolean) => void;
  resetState: () => void;
}

export const useServiceBusStore = create<ServiceBusState>((set, get) => ({
  // Initial state
  isConnected: false,
  namespaceInfo: null,
  error: null,
  isLoading: false,
  lastConnectionString: "",
  selectedNode: null,
  searchTerm: "",
  messages: [],
  isLoadingMessages: false,
  dlqMessages: [],
  isLoadingDlqMessages: false,
  selectedMessage: null,
  deletingMessage: {},
  resendingMessage: {},

  // Actions
  setSelectedNode: (node) => set({ selectedNode: node }),
  setSearchTerm: (term) => set({ searchTerm: term }),
  setSelectedMessage: (message) => set({ selectedMessage: message }),
  setMessages: (messages) => set({ messages, deletingMessage: {} }),
  setDlqMessages: (messages) => set({ dlqMessages: messages, deletingMessage: {} }),
  setDeletingMessage: (key, value) =>
    set((state) => ({
      deletingMessage: {
        ...state.deletingMessage,
        [key]: value,
      },
    })),
  setResendingMessage: (key, value) =>
    set((state) => ({
      resendingMessage: {
        ...state.resendingMessage,
        [key]: value,
      },
    })),
  setError: (error) => set({ error }),
  setLoading: (loading) => set({ isLoading: loading }),
  setConnected: (connected) => set({ isConnected: connected }),
  setNamespaceInfo: (info) => set({ namespaceInfo: info }),
  setLastConnectionString: (connectionString) => set({ lastConnectionString: connectionString }),
  setIsLoadingMessages: (loading) => set({ isLoadingMessages: loading }),
  setIsLoadingDlqMessages: (loading) => set({ isLoadingDlqMessages: loading }),
  resetState: () =>
    set({
      isConnected: false,
      namespaceInfo: null,
      error: null,
      isLoading: false,
      lastConnectionString: "",
      selectedNode: null,
      searchTerm: "",
      messages: [],
      isLoadingMessages: false,
      dlqMessages: [],
      isLoadingDlqMessages: false,
      selectedMessage: null,
      deletingMessage: {},
      resendingMessage: {},
    }),
}));

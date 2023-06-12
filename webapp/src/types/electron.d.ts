interface ElectronAPI {
  connectServiceBus: (connectionString: string) => Promise<{
    success: boolean;
    data?: {
      name: string;
      endpoint: string;
    };
    error?: string;
  }>;

  listQueues: () => Promise<{
    success: boolean;
    data?: string[];
    error?: string;
  }>;

  listTopics: () => Promise<{
    success: boolean;
    data?: string[];
    error?: string;
  }>;

  disconnectServiceBus: () => Promise<{
    success: boolean;
    error?: string;
  }>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

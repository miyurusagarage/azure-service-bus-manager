import { ipcMain } from "electron";
import { ServiceBusManager } from "./serviceBus";

export function setupIpcHandlers() {
  const serviceBus = new ServiceBusManager();

  ipcMain.handle("connect-service-bus", async (_, connectionString: string) => {
    try {
      const result = await serviceBus.connect(connectionString);
      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });

  ipcMain.handle("list-queues", async () => {
    try {
      const queues = await serviceBus.listQueues();
      return { success: true, data: queues };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });

  ipcMain.handle("list-topics", async () => {
    try {
      const topics = await serviceBus.listTopics();
      return { success: true, data: topics };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });

  ipcMain.handle("disconnect-service-bus", () => {
    serviceBus.disconnect();
    return { success: true };
  });
}

// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  connectServiceBus: (connectionString: string) =>
    ipcRenderer.invoke("connect-service-bus", connectionString),

  listQueues: () => ipcRenderer.invoke("list-queues"),

  listTopics: () => ipcRenderer.invoke("list-topics"),

  disconnectServiceBus: () => ipcRenderer.invoke("disconnect-service-bus"),
});

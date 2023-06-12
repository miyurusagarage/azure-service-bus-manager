import { app, BrowserWindow } from "electron";
import * as path from "path";
import started from "electron-squirrel-startup";
import { setupIpcHandlers } from "./ipc";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

async function waitForWebServer(url: string, maxAttempts: number = 10): Promise<boolean> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await fetch(url);
      if (response.ok) return true;
    } catch (err) {
      console.log(`Waiting for dev server... attempt ${attempt + 1}/${maxAttempts}`);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  return false;
}

async function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // Try to connect to dev server first
  const devServerUrl = "http://localhost:3000";
  const serverReady = await waitForWebServer(devServerUrl);

  if (serverReady) {
    console.log("Development server found, loading from dev server");
    try {
      await mainWindow.loadURL(devServerUrl);
      mainWindow.webContents.openDevTools();
    } catch (err) {
      console.error("Failed to load development server:", err);
      app.quit();
    }
  } else {
    // Fall back to production build
    console.log("No development server found, trying production build");
    try {
      await mainWindow.loadFile(path.join(__dirname, "../../webapp/dist/index.html"));
    } catch (err) {
      console.error("Failed to load production build:", err);
      app.quit();
    }
  }
}

// Set up IPC handlers before app is ready
setupIpcHandlers();

// This method will be called when Electron has finished initialization
app.whenReady().then(createWindow);

// Quit when all windows are closed, except on macOS
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

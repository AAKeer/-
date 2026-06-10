import { BrowserWindow, ipcMain } from "electron";
import { clearAixwSession, getDashboardEnvelope } from "./aixwClient.js";
import { openAixwLoginWindow } from "./authWindow.js";

export function registerIpc(mainWindow: BrowserWindow): void {
  ipcMain.handle("dashboard:refresh", async () => getDashboardEnvelope());

  ipcMain.handle("auth:login", async () => {
    await openAixwLoginWindow(mainWindow);
    return getDashboardEnvelope();
  });

  ipcMain.handle("auth:logout", async () => {
    await clearAixwSession();
    return {
      authState: "unauthenticated",
      data: null,
      errorMessage: null,
    };
  });
}

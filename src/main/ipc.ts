import { BrowserWindow, ipcMain } from "electron";
import { clearAixwSession } from "./aixwClient.js";
import { openAixwLoginWindow } from "./authWindow.js";
import { refreshDashboardNow, resetDashboardCache } from "./dashboardStore.js";

export function registerIpc(mainWindow: BrowserWindow): void {
  ipcMain.handle("dashboard:refresh", async () => refreshDashboardNow());

  ipcMain.handle("auth:login", async () => {
    await openAixwLoginWindow(mainWindow);
    return refreshDashboardNow();
  });

  ipcMain.handle("auth:logout", async () => {
    await clearAixwSession();
    return resetDashboardCache();
  });
}

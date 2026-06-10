import { BrowserWindow } from "electron";
import { hasAuthenticatedAixwSession } from "./aixwClient.js";

export function openAixwLoginWindow(parent: BrowserWindow): Promise<void> {
  return new Promise((resolve) => {
    let resolved = false;
    let authCheckTimer: NodeJS.Timeout | null = null;

    const loginWindow = new BrowserWindow({
      width: 1100,
      height: 760,
      parent,
      modal: false,
      title: "登录 AIXW",
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    loginWindow.loadURL("https://aixw.org/login");

    const finish = () => {
      if (resolved) {
        return;
      }
      resolved = true;
      if (authCheckTimer) {
        clearInterval(authCheckTimer);
        authCheckTimer = null;
      }
      resolve();
      if (!loginWindow.isDestroyed()) {
        loginWindow.close();
      }
    };

    const checkAuthenticated = async () => {
      if (loginWindow.isDestroyed()) {
        finish();
        return;
      }
      if (await hasAuthenticatedAixwSession()) {
        finish();
      }
    };

    const maybeResolve = (url: string) => {
      if (url.includes("/dashboard") || url.includes("/profile")) {
        void checkAuthenticated();
      }
    };

    authCheckTimer = setInterval(() => {
      void checkAuthenticated();
    }, 1000);

    loginWindow.webContents.on("did-navigate", (_event, url) => maybeResolve(url));
    loginWindow.webContents.on("did-navigate-in-page", (_event, url) => maybeResolve(url));
    loginWindow.on("closed", finish);
  });
}

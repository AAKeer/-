import { BrowserWindow } from "electron";
import { hasAuthenticatedAixwSession, setAixwAuthTokens } from "./aixwClient.js";

interface AixwStorageTokens {
  authToken: string | null;
  refreshToken: string | null;
  tokenExpiresAt: string | null;
}

async function readAixwStorageTokens(loginWindow: BrowserWindow): Promise<AixwStorageTokens | null> {
  try {
    return (await loginWindow.webContents.executeJavaScript(
      `({
        authToken: window.localStorage.getItem("auth_token"),
        refreshToken: window.localStorage.getItem("refresh_token"),
        tokenExpiresAt: window.localStorage.getItem("token_expires_at")
      })`,
      true,
    )) as AixwStorageTokens;
  } catch {
    return null;
  }
}

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
      if (!parent.isDestroyed()) {
        parent.show();
        parent.focus();
      }
    };

    const checkAuthenticated = async () => {
      if (loginWindow.isDestroyed()) {
        finish();
        return;
      }
      const tokens = await readAixwStorageTokens(loginWindow);
      if (tokens?.authToken) {
        setAixwAuthTokens(tokens);
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

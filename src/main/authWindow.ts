import { BrowserWindow } from "electron";

export function openAixwLoginWindow(parent: BrowserWindow): Promise<void> {
  return new Promise((resolve) => {
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

    const maybeResolve = (url: string) => {
      if (url.includes("/dashboard") || url.includes("/profile")) {
        resolve();
        loginWindow.close();
      }
    };

    loginWindow.webContents.on("did-navigate", (_event, url) => maybeResolve(url));
    loginWindow.webContents.on("did-navigate-in-page", (_event, url) => maybeResolve(url));
    loginWindow.on("closed", () => resolve());
  });
}

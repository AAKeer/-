import { app, BrowserWindow, Menu, Tray, nativeImage } from "electron";
import { refreshDashboardNow } from "./dashboardStore.js";
import { toggleMiniWindow } from "./miniWindow.js";

function createTrayIcon() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
      <rect width="64" height="64" rx="14" fill="#071923"/>
      <path d="M18 42h28M21 36l7-18h8l7 18M25 30h14" fill="none" stroke="#34d399" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="48" cy="16" r="6" fill="#60a5fa"/>
    </svg>`;
  const image = nativeImage.createFromDataURL(`data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`);
  return image.resize({ width: 16, height: 16 });
}

export function createAppTray(mainWindow: BrowserWindow, miniWindow: BrowserWindow): Tray {
  const tray = new Tray(createTrayIcon());
  tray.setToolTip("AIXW 桌面实时看板");
  tray.setContextMenu(
    Menu.buildFromTemplate([
      {
        label: "打开主窗口",
        click: () => {
          mainWindow.show();
          mainWindow.focus();
        },
      },
      {
        label: "刷新数据",
        click: () => {
          void refreshDashboardNow();
        },
      },
      { type: "separator" },
      {
        label: "退出",
        click: () => {
          app.quit();
        },
      },
    ]),
  );

  tray.on("click", () => {
    toggleMiniWindow(miniWindow, tray);
  });

  tray.on("double-click", () => {
    mainWindow.show();
    mainWindow.focus();
  });

  return tray;
}

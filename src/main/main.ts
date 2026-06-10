import { app, BrowserWindow, Tray } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { startDashboardPolling, stopDashboardPolling } from "./dashboardStore.js";
import { registerIpc } from "./ipc.js";
import { createMiniWindow } from "./miniWindow.js";
import { createAppTray } from "./tray.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;
let miniWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;

function createWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow({
    width: 1320,
    height: 760,
    minWidth: 960,
    minHeight: 620,
    title: "AIXW 桌面实时看板",
    backgroundColor: "#071923",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  registerIpc(mainWindow);

  mainWindow.on("close", (event) => {
    if (isQuitting) {
      return;
    }

    event.preventDefault();
    mainWindow.hide();
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../../dist/index.html"));
  }

  return mainWindow;
}

app.whenReady().then(() => {
  mainWindow = createWindow();
  miniWindow = createMiniWindow(path.join(__dirname, "preload.cjs"), path.join(__dirname, "../../dist"));
  tray = createAppTray(mainWindow, miniWindow);
  startDashboardPolling();
});

app.on("before-quit", () => {
  isQuitting = true;
  stopDashboardPolling();
});

app.on("window-all-closed", () => {
  // 托盘模式下保持后台运行，真正退出由托盘菜单处理。
});

app.on("activate", () => {
  if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
    return;
  }

  mainWindow = createWindow();
  if (!miniWindow) {
    miniWindow = createMiniWindow(path.join(__dirname, "preload.cjs"), path.join(__dirname, "../../dist"));
  }
  if (!tray) {
    tray = createAppTray(mainWindow, miniWindow);
  }
});

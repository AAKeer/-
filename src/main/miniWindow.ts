import { BrowserWindow, Tray, screen } from "electron";
import path from "node:path";

const MINI_WIDTH = 380;
const MINI_HEIGHT = 430;

export function createMiniWindow(preloadPath: string, rendererEntry: string): BrowserWindow {
  const miniWindow = new BrowserWindow({
    width: MINI_WIDTH,
    height: MINI_HEIGHT,
    show: false,
    frame: false,
    resizable: false,
    movable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    transparent: true,
    backgroundColor: "#00000000",
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    miniWindow.loadURL(`${process.env.VITE_DEV_SERVER_URL}?mini=1`);
  } else {
    miniWindow.loadFile(path.join(rendererEntry, "index.html"), { query: { mini: "1" } });
  }

  miniWindow.on("blur", () => {
    if (!miniWindow.isDestroyed()) {
      miniWindow.hide();
    }
  });

  return miniWindow;
}

export function toggleMiniWindow(miniWindow: BrowserWindow, tray: Tray): void {
  if (miniWindow.isVisible()) {
    miniWindow.hide();
    return;
  }

  positionMiniWindow(miniWindow, tray);
  miniWindow.show();
  miniWindow.focus();
}

function positionMiniWindow(miniWindow: BrowserWindow, tray: Tray): void {
  const trayBounds = tray.getBounds();
  const display = screen.getDisplayNearestPoint({
    x: trayBounds.x + Math.round(trayBounds.width / 2),
    y: trayBounds.y + Math.round(trayBounds.height / 2),
  });
  const { workArea } = display;

  const x = clamp(
    trayBounds.x + Math.round(trayBounds.width / 2) - Math.round(MINI_WIDTH / 2),
    workArea.x + 8,
    workArea.x + workArea.width - MINI_WIDTH - 8,
  );
  const preferAbove = trayBounds.y > workArea.y + Math.round(workArea.height / 2);
  const y = preferAbove
    ? workArea.y + workArea.height - MINI_HEIGHT - 12
    : workArea.y + 12;

  miniWindow.setBounds({ x, y, width: MINI_WIDTH, height: MINI_HEIGHT });
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

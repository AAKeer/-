# AIXW 桌面实时看板实现计划

> **给 agentic workers 的要求：** 必须使用 `superpowers:subagent-driven-development`（推荐）或 `superpowers:executing-plans` 逐任务执行本计划。步骤使用 checkbox（`- [ ]`）语法跟踪进度。

**目标：** 构建一个 Electron + React + TypeScript 桌面软件，登录 AIXW 后每 15 秒读取当前账号指标并展示深色卡片式看板。

**架构：** Electron 主进程负责窗口、登录态、AIXW API 请求和数据归一化；React 渲染进程只负责展示数据和触发登录、刷新、退出登录动作。主进程通过 IPC 暴露最小能力，避免界面层直接接触 Cookie 或账号凭证。

**技术栈：** Electron、React、TypeScript、Vite、Vitest、Testing Library、electron-builder、lucide-react。

---

## 文件结构

计划完成后项目结构如下：

```text
.
├─ package.json
├─ package-lock.json
├─ tsconfig.json
├─ tsconfig.node.json
├─ vite.config.ts
├─ index.html
├─ electron-builder.json
├─ docs/
│  └─ superpowers/
│     ├─ specs/
│     │  └─ 2026-06-10-aixw-desktop-dashboard-design.md
│     └─ plans/
│        └─ 2026-06-10-aixw-desktop-dashboard.md
├─ src/
│  ├─ main/
│  │  ├─ main.ts
│  │  ├─ preload.ts
│  │  ├─ aixwClient.ts
│  │  ├─ dashboardMapper.ts
│  │  ├─ authWindow.ts
│  │  └─ ipc.ts
│  ├─ shared/
│  │  └─ dashboardTypes.ts
│  └─ renderer/
│     ├─ main.tsx
│     ├─ App.tsx
│     ├─ api.ts
│     ├─ styles.css
│     └─ components/
│        ├─ HeaderBar.tsx
│        ├─ MetricCard.tsx
│        ├─ DashboardGrid.tsx
│        └─ StatusBanner.tsx
└─ tests/
   ├─ dashboardMapper.test.ts
   └─ formatters.test.ts
```

职责划分：

- `src/main/aixwClient.ts`：封装 AIXW 登录态请求，不处理界面。
- `src/main/dashboardMapper.ts`：把多个接口结果整理成统一看板数据。
- `src/main/authWindow.ts`：打开登录窗口、检测登录完成、清除登录态。
- `src/main/ipc.ts`：注册 IPC 方法，连接渲染进程和主进程。
- `src/shared/dashboardTypes.ts`：主进程和渲染进程共享的数据类型。
- `src/renderer/*`：纯界面展示、刷新倒计时、用户操作。
- `tests/*`：优先覆盖缓存命中率、Token 单位、数据映射等不依赖真实网站的逻辑。

---

## Task 1：初始化项目与基础脚手架

**Files:**

- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `.gitignore`
- Create: `electron-builder.json`

- [ ] **Step 1：初始化 Git 仓库**

Run:

```powershell
git init
git status --short
```

Expected:

```text
Initialized empty Git repository
```

- [ ] **Step 2：创建 `package.json`**

写入：

```json
{
  "name": "aixw-desktop-dashboard",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "dist-electron/main/main.js",
  "scripts": {
    "dev": "concurrently -k \"vite --host 127.0.0.1\" \"wait-on tcp:5173 && cross-env VITE_DEV_SERVER_URL=http://127.0.0.1:5173 electron .\"",
    "build": "tsc -p tsconfig.node.json && vite build",
    "test": "vitest run",
    "test:watch": "vitest",
    "dist": "npm run build && electron-builder --win",
    "typecheck": "tsc --noEmit && tsc -p tsconfig.node.json --noEmit"
  },
  "dependencies": {
    "@vitejs/plugin-react": "^5.0.0",
    "electron": "^37.0.0",
    "lucide-react": "^0.468.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.0",
    "@testing-library/react": "^16.0.0",
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "concurrently": "^9.0.0",
    "cross-env": "^7.0.3",
    "electron-builder": "^26.0.0",
    "jsdom": "^25.0.0",
    "typescript": "^5.8.0",
    "vite": "^7.0.0",
    "vitest": "^3.0.0",
    "wait-on": "^8.0.0"
  }
}
```

- [ ] **Step 3：创建 TypeScript 和 Vite 配置**

`tsconfig.json`：

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src/renderer", "src/shared", "tests", "vite.config.ts"]
}
```

`tsconfig.node.json`：

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "dist-electron",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "types": ["node", "electron"]
  },
  "include": ["src/main", "src/shared"]
}
```

`vite.config.ts`：

```ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 5173,
  },
  build: {
    outDir: "dist",
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: [],
  },
});
```

- [ ] **Step 4：创建入口和打包配置**

`index.html`：

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AIXW 桌面实时看板</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/renderer/main.tsx"></script>
  </body>
</html>
```

`.gitignore`：

```gitignore
node_modules/
dist/
dist-electron/
release/
.superpowers/
*.log
```

`electron-builder.json`：

```json
{
  "appId": "local.aixw.dashboard",
  "productName": "AIXW 桌面实时看板",
  "directories": {
    "output": "release"
  },
  "files": ["dist/**", "dist-electron/**", "package.json"],
  "win": {
    "target": ["nsis"]
  }
}
```

- [ ] **Step 5：安装依赖**

Run:

```powershell
npm install
```

Expected:

```text
added ... packages
```

- [ ] **Step 6：提交脚手架**

Run:

```powershell
git add package.json package-lock.json tsconfig.json tsconfig.node.json vite.config.ts index.html .gitignore electron-builder.json
git commit -m "chore: 初始化 Electron 项目脚手架"
```

Expected:

```text
[main ...] chore: 初始化 Electron 项目脚手架
```

---

## Task 2：定义共享类型与格式化函数

**Files:**

- Create: `src/shared/dashboardTypes.ts`
- Create: `src/renderer/formatters.ts`
- Create: `tests/formatters.test.ts`

- [ ] **Step 1：先写格式化测试**

`tests/formatters.test.ts`：

```ts
import { describe, expect, it } from "vitest";
import { formatCost, formatInteger, formatPercent, formatTokenWan } from "../src/renderer/formatters";

describe("formatters", () => {
  it("把 token 换算成万", () => {
    expect(formatTokenWan(41000)).toBe("4.10 万");
    expect(formatTokenWan(440000)).toBe("44.00 万");
  });

  it("格式化消费金额", () => {
    expect(formatCost(4.01567)).toBe("$4.0157");
    expect(formatCost(null)).toBe("-");
  });

  it("格式化整数和百分比", () => {
    expect(formatInteger(1227)).toBe("1,227");
    expect(formatPercent(35.678)).toBe("35.7%");
    expect(formatPercent(null)).toBe("-");
  });
});
```

- [ ] **Step 2：运行测试确认失败**

Run:

```powershell
npm test -- tests/formatters.test.ts
```

Expected:

```text
FAIL tests/formatters.test.ts
Cannot find module '../src/renderer/formatters'
```

- [ ] **Step 3：创建共享类型**

`src/shared/dashboardTypes.ts`：

```ts
export type AuthState = "unknown" | "authenticated" | "unauthenticated";

export interface DashboardMetric {
  label: string;
  value: string;
  helper?: string;
  tone: "green" | "blue" | "amber" | "purple" | "rose" | "cyan";
  icon: "wallet" | "key" | "activity" | "dollar" | "box" | "database" | "gauge" | "clock";
}

export interface DashboardData {
  balance: number | null;
  apiKeyCount: number | null;
  activeApiKeyCount: number | null;
  todayRequests: number | null;
  totalRequests: number | null;
  todayActualCost: number | null;
  totalActualCost: number | null;
  todayTokens: number | null;
  totalTokens: number | null;
  cacheHitRate: number | null;
  averageDurationMs: number | null;
  rpm: number | null;
  tpm: number | null;
  lastUpdatedAt: string | null;
}

export interface DashboardEnvelope {
  authState: AuthState;
  data: DashboardData | null;
  errorMessage: string | null;
}

export interface AixwProfileResponse {
  id?: number;
  email?: string;
  username?: string;
  balance?: number;
}

export interface AixwKeysResponse {
  items?: Array<{ id: number; name?: string; status?: number | string | boolean }>;
  total?: number;
}

export interface AixwUsageStatsResponse {
  total_requests?: number;
  today_requests?: number;
  total_actual_cost?: number;
  today_actual_cost?: number;
  total_cost?: number;
  today_cost?: number;
  total_tokens?: number;
  today_tokens?: number;
  total_input_tokens?: number;
  today_input_tokens?: number;
  total_output_tokens?: number;
  today_output_tokens?: number;
  total_cache_read_tokens?: number;
  total_cache_creation_tokens?: number;
  average_duration_ms?: number;
  rpm?: number;
  tpm?: number;
  cache_hit_rate?: number;
}
```

- [ ] **Step 4：实现金额、整数、Token、百分比格式化**

`src/renderer/formatters.ts`：

```ts
export function formatInteger(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "-";
  }
  return Math.round(value).toLocaleString("en-US");
}

export function formatCost(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "-";
  }
  return `$${value.toFixed(4)}`;
}

export function formatTokenWan(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "-";
  }
  return `${(value / 10000).toFixed(2)} 万`;
}

export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "-";
  }
  return `${value.toFixed(1)}%`;
}

export function formatDuration(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "-";
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(2)}s`;
  }
  return `${Math.round(value)}ms`;
}
```

- [ ] **Step 5：运行测试确认通过**

Run:

```powershell
npm test -- tests/formatters.test.ts
```

Expected:

```text
PASS tests/formatters.test.ts
```

- [ ] **Step 6：提交类型和格式化函数**

Run:

```powershell
git add src/shared/dashboardTypes.ts src/renderer/formatters.ts tests/formatters.test.ts
git commit -m "feat: 添加看板类型和格式化函数"
```

---

## Task 3：实现 AIXW 数据映射与缓存命中率计算

**Files:**

- Create: `src/main/dashboardMapper.ts`
- Create: `tests/dashboardMapper.test.ts`

- [ ] **Step 1：写映射测试**

`tests/dashboardMapper.test.ts`：

```ts
import { describe, expect, it } from "vitest";
import { mapDashboardData } from "../src/main/dashboardMapper";
import type { AixwKeysResponse, AixwProfileResponse, AixwUsageStatsResponse } from "../src/shared/dashboardTypes";

describe("mapDashboardData", () => {
  it("合并用户、密钥和用量统计", () => {
    const profile: AixwProfileResponse = { balance: 47.25 };
    const keys: AixwKeysResponse = {
      items: [
        { id: 1, status: 1 },
        { id: 2, status: 0 },
        { id: 3, status: "active" },
      ],
      total: 3,
    };
    const dashboardStats: AixwUsageStatsResponse = {
      today_requests: 125,
      total_requests: 1227,
      today_actual_cost: 4.0157,
      total_actual_cost: 52.7462,
      today_tokens: 41000,
      total_tokens: 440000,
      average_duration_ms: 13710,
      rpm: 4,
      tpm: 41700,
    };
    const usageStats: AixwUsageStatsResponse = {
      total_input_tokens: 1000,
      total_cache_creation_tokens: 500,
      total_cache_read_tokens: 500,
    };

    const result = mapDashboardData(profile, keys, dashboardStats, usageStats);

    expect(result.balance).toBe(47.25);
    expect(result.apiKeyCount).toBe(3);
    expect(result.activeApiKeyCount).toBe(2);
    expect(result.todayRequests).toBe(125);
    expect(result.totalRequests).toBe(1227);
    expect(result.todayActualCost).toBe(4.0157);
    expect(result.totalActualCost).toBe(52.7462);
    expect(result.todayTokens).toBe(41000);
    expect(result.totalTokens).toBe(440000);
    expect(result.averageDurationMs).toBe(13710);
    expect(result.rpm).toBe(4);
    expect(result.tpm).toBe(41700);
    expect(result.cacheHitRate).toBe(25);
  });

  it("优先使用接口直接返回的缓存命中率", () => {
    const result = mapDashboardData(
      { balance: 1 },
      { items: [], total: 0 },
      { cache_hit_rate: 88.8 },
      { total_input_tokens: 100, total_cache_read_tokens: 20, total_cache_creation_tokens: 10 },
    );

    expect(result.cacheHitRate).toBe(88.8);
  });

  it("缓存命中率分母为 0 时返回 null", () => {
    const result = mapDashboardData(
      { balance: 1 },
      { items: [], total: 0 },
      {},
      { total_input_tokens: 0, total_cache_read_tokens: 0, total_cache_creation_tokens: 0 },
    );

    expect(result.cacheHitRate).toBeNull();
  });
});
```

- [ ] **Step 2：运行测试确认失败**

Run:

```powershell
npm test -- tests/dashboardMapper.test.ts
```

Expected:

```text
FAIL tests/dashboardMapper.test.ts
Cannot find module '../src/main/dashboardMapper'
```

- [ ] **Step 3：实现映射逻辑**

`src/main/dashboardMapper.ts`：

```ts
import type {
  AixwKeysResponse,
  AixwProfileResponse,
  AixwUsageStatsResponse,
  DashboardData,
} from "../shared/dashboardTypes";

function numberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function isActiveKeyStatus(status: unknown): boolean {
  return status === 1 || status === true || status === "active" || status === "enabled";
}

function calculateCacheHitRate(stats: AixwUsageStatsResponse | null | undefined): number | null {
  if (!stats) {
    return null;
  }

  const directRate = numberOrNull(stats.cache_hit_rate);
  if (directRate !== null) {
    return directRate;
  }

  const input = numberOrNull(stats.total_input_tokens) ?? 0;
  const cacheCreate = numberOrNull(stats.total_cache_creation_tokens) ?? 0;
  const cacheRead = numberOrNull(stats.total_cache_read_tokens) ?? 0;
  const denominator = input + cacheCreate + cacheRead;

  if (denominator <= 0) {
    return null;
  }

  return (cacheRead / denominator) * 100;
}

export function mapDashboardData(
  profile: AixwProfileResponse,
  keys: AixwKeysResponse,
  dashboardStats: AixwUsageStatsResponse,
  usageStats?: AixwUsageStatsResponse | null,
): DashboardData {
  const keyItems = keys.items ?? [];
  const keyTotal = typeof keys.total === "number" ? keys.total : keyItems.length;
  const activeCount = keyItems.filter((item) => isActiveKeyStatus(item.status)).length;
  const cacheSource = dashboardStats.cache_hit_rate !== undefined ? dashboardStats : usageStats ?? dashboardStats;

  return {
    balance: numberOrNull(profile.balance),
    apiKeyCount: keyTotal,
    activeApiKeyCount: activeCount,
    todayRequests: numberOrNull(dashboardStats.today_requests),
    totalRequests: numberOrNull(dashboardStats.total_requests),
    todayActualCost: numberOrNull(dashboardStats.today_actual_cost),
    totalActualCost: numberOrNull(dashboardStats.total_actual_cost),
    todayTokens: numberOrNull(dashboardStats.today_tokens),
    totalTokens: numberOrNull(dashboardStats.total_tokens),
    cacheHitRate: calculateCacheHitRate(cacheSource),
    averageDurationMs: numberOrNull(dashboardStats.average_duration_ms),
    rpm: numberOrNull(dashboardStats.rpm),
    tpm: numberOrNull(dashboardStats.tpm),
    lastUpdatedAt: new Date().toISOString(),
  };
}
```

- [ ] **Step 4：运行测试确认通过**

Run:

```powershell
npm test -- tests/dashboardMapper.test.ts
```

Expected:

```text
PASS tests/dashboardMapper.test.ts
```

- [ ] **Step 5：提交映射逻辑**

Run:

```powershell
git add src/main/dashboardMapper.ts tests/dashboardMapper.test.ts
git commit -m "feat: 添加 AIXW 看板数据映射"
```

---

## Task 4：实现 Electron 主进程、预加载和 IPC

**Files:**

- Create: `src/main/main.ts`
- Create: `src/main/preload.ts`
- Create: `src/main/aixwClient.ts`
- Create: `src/main/authWindow.ts`
- Create: `src/main/ipc.ts`

- [ ] **Step 1：实现 AIXW 客户端**

`src/main/aixwClient.ts`：

```ts
import { net, session } from "electron";
import { mapDashboardData } from "./dashboardMapper.js";
import type {
  AixwKeysResponse,
  AixwProfileResponse,
  AixwUsageStatsResponse,
  DashboardEnvelope,
} from "../shared/dashboardTypes.js";

const AIXW_ORIGIN = "https://aixw.org";
const API_PREFIX = `${AIXW_ORIGIN}/api/v1`;

async function requestJson<T>(path: string): Promise<T> {
  const response = await net.fetch(`${API_PREFIX}${path}`, {
    method: "GET",
    session: session.defaultSession,
    headers: {
      Accept: "application/json",
    },
  });

  if (response.status === 401 || response.status === 403) {
    throw new Error("AUTH_EXPIRED");
  }

  if (!response.ok) {
    throw new Error(`AIXW_REQUEST_FAILED_${response.status}`);
  }

  return (await response.json()) as T;
}

function todayRangeQuery(): string {
  const today = new Date().toISOString().slice(0, 10);
  return `start_date=${today}&end_date=${today}`;
}

export async function getDashboardEnvelope(): Promise<DashboardEnvelope> {
  try {
    const [profile, keys, dashboardStats, usageStats] = await Promise.all([
      requestJson<AixwProfileResponse>("/user/profile"),
      requestJson<AixwKeysResponse>("/keys?page=1&page_size=100"),
      requestJson<AixwUsageStatsResponse>("/usage/dashboard/stats"),
      requestJson<AixwUsageStatsResponse>(`/usage/stats?${todayRangeQuery()}`),
    ]);

    return {
      authState: "authenticated",
      data: mapDashboardData(profile, keys, dashboardStats, usageStats),
      errorMessage: null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
    const authState = message === "AUTH_EXPIRED" ? "unauthenticated" : "unknown";

    return {
      authState,
      data: null,
      errorMessage: message === "AUTH_EXPIRED" ? "登录已过期，请重新登录。" : `读取 AIXW 数据失败：${message}`,
    };
  }
}

export async function clearAixwSession(): Promise<void> {
  await session.defaultSession.clearStorageData({
    origin: AIXW_ORIGIN,
    storages: ["cookies", "localstorage", "indexdb", "cachestorage"],
  });
}
```

- [ ] **Step 2：实现登录窗口**

`src/main/authWindow.ts`：

```ts
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
```

- [ ] **Step 3：实现 IPC**

`src/main/ipc.ts`：

```ts
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
```

- [ ] **Step 4：实现预加载安全桥**

`src/main/preload.ts`：

```ts
import { contextBridge, ipcRenderer } from "electron";
import type { DashboardEnvelope } from "../shared/dashboardTypes";

export interface AixwDashboardApi {
  refreshDashboard: () => Promise<DashboardEnvelope>;
  login: () => Promise<DashboardEnvelope>;
  logout: () => Promise<DashboardEnvelope>;
}

const api: AixwDashboardApi = {
  refreshDashboard: () => ipcRenderer.invoke("dashboard:refresh") as Promise<DashboardEnvelope>,
  login: () => ipcRenderer.invoke("auth:login") as Promise<DashboardEnvelope>,
  logout: () => ipcRenderer.invoke("auth:logout") as Promise<DashboardEnvelope>,
};

contextBridge.exposeInMainWorld("aixwDashboard", api);
```

- [ ] **Step 5：实现主窗口**

`src/main/main.ts`：

```ts
import { app, BrowserWindow } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { registerIpc } from "./ipc.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1320,
    height: 760,
    minWidth: 960,
    minHeight: 620,
    title: "AIXW 桌面实时看板",
    backgroundColor: "#071923",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  registerIpc(mainWindow);

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../../dist/index.html"));
  }
}

app.whenReady().then(createWindow);

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
```

- [ ] **Step 6：类型检查主进程**

Run:

```powershell
npm run typecheck
```

Expected:

```text
退出码 0，没有 TypeScript 错误
```

- [ ] **Step 7：提交主进程能力**

Run:

```powershell
git add src/main/main.ts src/main/preload.ts src/main/aixwClient.ts src/main/authWindow.ts src/main/ipc.ts
git commit -m "feat: 添加 Electron 主进程和 AIXW IPC"
```

---

## Task 5：实现 React 界面和 15 秒刷新

**Files:**

- Create: `src/renderer/main.tsx`
- Create: `src/renderer/App.tsx`
- Create: `src/renderer/api.ts`
- Create: `src/renderer/styles.css`
- Create: `src/renderer/components/HeaderBar.tsx`
- Create: `src/renderer/components/MetricCard.tsx`
- Create: `src/renderer/components/DashboardGrid.tsx`
- Create: `src/renderer/components/StatusBanner.tsx`

- [ ] **Step 1：声明渲染进程 API**

`src/renderer/api.ts`：

```ts
import type { DashboardEnvelope } from "../shared/dashboardTypes";
import type { AixwDashboardApi } from "../main/preload";

declare global {
  interface Window {
    aixwDashboard: AixwDashboardApi;
  }
}

export function refreshDashboard(): Promise<DashboardEnvelope> {
  return window.aixwDashboard.refreshDashboard();
}

export function login(): Promise<DashboardEnvelope> {
  return window.aixwDashboard.login();
}

export function logout(): Promise<DashboardEnvelope> {
  return window.aixwDashboard.logout();
}
```

- [ ] **Step 2：实现 React 入口**

`src/renderer/main.tsx`：

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

- [ ] **Step 3：实现卡片组件**

`src/renderer/components/MetricCard.tsx`：

```tsx
import {
  Activity,
  Box,
  Clock,
  Database,
  DollarSign,
  Gauge,
  KeyRound,
  WalletCards,
} from "lucide-react";
import type { DashboardMetric } from "../../shared/dashboardTypes";

const icons = {
  wallet: WalletCards,
  key: KeyRound,
  activity: Activity,
  dollar: DollarSign,
  box: Box,
  database: Database,
  gauge: Gauge,
  clock: Clock,
};

export function MetricCard({ metric }: { metric: DashboardMetric }) {
  const Icon = icons[metric.icon];

  return (
    <article className={`metric-card tone-${metric.tone}`}>
      <div className="metric-icon">
        <Icon size={26} strokeWidth={2.2} />
      </div>
      <div className="metric-copy">
        <p className="metric-label">{metric.label}</p>
        <p className="metric-value">{metric.value}</p>
        {metric.helper ? <p className="metric-helper">{metric.helper}</p> : null}
      </div>
    </article>
  );
}
```

- [ ] **Step 4：实现顶部栏和错误提示**

`src/renderer/components/HeaderBar.tsx`：

```tsx
import { LogIn, LogOut, RefreshCw } from "lucide-react";
import type { AuthState } from "../../shared/dashboardTypes";

interface HeaderBarProps {
  authState: AuthState;
  loading: boolean;
  countdown: number;
  lastUpdatedAt: string | null;
  onRefresh: () => void;
  onLogin: () => void;
  onLogout: () => void;
}

export function HeaderBar(props: HeaderBarProps) {
  const lastUpdated = props.lastUpdatedAt ? new Date(props.lastUpdatedAt).toLocaleTimeString("zh-CN") : "-";

  return (
    <header className="header-bar">
      <div>
        <h1>AIXW 桌面实时看板</h1>
        <p>每 15 秒刷新一次 · 最近刷新：{lastUpdated}</p>
      </div>
      <div className="header-actions">
        <span className={`auth-pill auth-${props.authState}`}>
          {props.authState === "authenticated" ? "已登录" : "未登录"}
        </span>
        <button className="icon-button" onClick={props.onRefresh} disabled={props.loading}>
          <RefreshCw size={18} className={props.loading ? "spin" : ""} />
          {props.loading ? "刷新中" : `刷新 ${props.countdown}s`}
        </button>
        {props.authState === "authenticated" ? (
          <button className="icon-button" onClick={props.onLogout}>
            <LogOut size={18} />
            退出
          </button>
        ) : (
          <button className="primary-button" onClick={props.onLogin}>
            <LogIn size={18} />
            登录
          </button>
        )}
      </div>
    </header>
  );
}
```

`src/renderer/components/StatusBanner.tsx`：

```tsx
export function StatusBanner({ message }: { message: string | null }) {
  if (!message) {
    return null;
  }

  return <div className="status-banner">{message}</div>;
}
```

- [ ] **Step 5：实现看板网格**

`src/renderer/components/DashboardGrid.tsx`：

```tsx
import type { DashboardData, DashboardMetric } from "../../shared/dashboardTypes";
import { formatCost, formatDuration, formatInteger, formatPercent, formatTokenWan } from "../formatters";
import { MetricCard } from "./MetricCard";

function toMetrics(data: DashboardData | null): DashboardMetric[] {
  return [
    {
      label: "余额",
      value: formatCost(data?.balance),
      helper: "可用",
      tone: "green",
      icon: "wallet",
    },
    {
      label: "API 密钥",
      value: formatInteger(data?.apiKeyCount),
      helper: `${formatInteger(data?.activeApiKeyCount)} 启用`,
      tone: "blue",
      icon: "key",
    },
    {
      label: "今日请求",
      value: formatInteger(data?.todayRequests),
      helper: `总计：${formatInteger(data?.totalRequests)}`,
      tone: "green",
      icon: "activity",
    },
    {
      label: "今日消费",
      value: formatCost(data?.todayActualCost),
      helper: `总计：${formatCost(data?.totalActualCost)}`,
      tone: "purple",
      icon: "dollar",
    },
    {
      label: "今日 Token",
      value: formatTokenWan(data?.todayTokens),
      helper: "单位：万",
      tone: "amber",
      icon: "box",
    },
    {
      label: "累计 Token",
      value: formatTokenWan(data?.totalTokens),
      helper: "单位：万",
      tone: "blue",
      icon: "database",
    },
    {
      label: "缓存命中率",
      value: formatPercent(data?.cacheHitRate),
      helper: "按缓存读取 Token 计算",
      tone: "cyan",
      icon: "gauge",
    },
    {
      label: "平均响应",
      value: formatDuration(data?.averageDurationMs),
      helper: data?.rpm !== null && data?.rpm !== undefined ? `${formatInteger(data.rpm)} RPM` : "平均时间",
      tone: "rose",
      icon: "clock",
    },
  ];
}

export function DashboardGrid({ data }: { data: DashboardData | null }) {
  return (
    <main className="dashboard-grid">
      {toMetrics(data).map((metric) => (
        <MetricCard key={metric.label} metric={metric} />
      ))}
    </main>
  );
}
```

- [ ] **Step 6：实现 App 状态和 15 秒刷新**

`src/renderer/App.tsx`：

```tsx
import { useCallback, useEffect, useRef, useState } from "react";
import type { AuthState, DashboardData } from "../shared/dashboardTypes";
import { login, logout, refreshDashboard } from "./api";
import { DashboardGrid } from "./components/DashboardGrid";
import { HeaderBar } from "./components/HeaderBar";
import { StatusBanner } from "./components/StatusBanner";

const REFRESH_INTERVAL_SECONDS = 15;

export function App() {
  const [authState, setAuthState] = useState<AuthState>("unknown");
  const [data, setData] = useState<DashboardData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL_SECONDS);
  const refreshInFlight = useRef(false);

  const applyEnvelope = useCallback((envelope: Awaited<ReturnType<typeof refreshDashboard>>) => {
    setAuthState(envelope.authState);
    setErrorMessage(envelope.errorMessage);
    if (envelope.data) {
      setData(envelope.data);
    }
  }, []);

  const doRefresh = useCallback(async () => {
    if (refreshInFlight.current) {
      return;
    }
    refreshInFlight.current = true;
    setLoading(true);
    try {
      const envelope = await refreshDashboard();
      applyEnvelope(envelope);
      setCountdown(REFRESH_INTERVAL_SECONDS);
    } finally {
      refreshInFlight.current = false;
      setLoading(false);
    }
  }, [applyEnvelope]);

  const doLogin = useCallback(async () => {
    setLoading(true);
    try {
      applyEnvelope(await login());
      setCountdown(REFRESH_INTERVAL_SECONDS);
    } finally {
      setLoading(false);
    }
  }, [applyEnvelope]);

  const doLogout = useCallback(async () => {
    setLoading(true);
    try {
      applyEnvelope(await logout());
      setData(null);
      setCountdown(REFRESH_INTERVAL_SECONDS);
    } finally {
      setLoading(false);
    }
  }, [applyEnvelope]);

  useEffect(() => {
    void doRefresh();
  }, [doRefresh]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCountdown((value) => {
        if (authState !== "authenticated") {
          return REFRESH_INTERVAL_SECONDS;
        }
        if (value <= 1) {
          void doRefresh();
          return REFRESH_INTERVAL_SECONDS;
        }
        return value - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [authState, doRefresh]);

  return (
    <div className="app-shell">
      <HeaderBar
        authState={authState}
        loading={loading}
        countdown={countdown}
        lastUpdatedAt={data?.lastUpdatedAt ?? null}
        onRefresh={doRefresh}
        onLogin={doLogin}
        onLogout={doLogout}
      />
      <StatusBanner message={errorMessage} />
      <DashboardGrid data={data} />
    </div>
  );
}
```

- [ ] **Step 7：实现深色卡片样式**

`src/renderer/styles.css`：

```css
:root {
  color: #f8fafc;
  background: #061620;
  font-family: Inter, "Microsoft YaHei", "PingFang SC", system-ui, sans-serif;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-width: 960px;
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(20, 184, 166, 0.16), transparent 32rem),
    linear-gradient(135deg, #051923 0%, #08111f 100%);
}

button {
  font: inherit;
}

.app-shell {
  padding: 28px;
}

.header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 20px;
}

.header-bar h1 {
  margin: 0;
  font-size: 24px;
  letter-spacing: 0;
}

.header-bar p {
  margin: 6px 0 0;
  color: #8ea3b4;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.auth-pill,
.icon-button,
.primary-button {
  height: 38px;
  border: 1px solid rgba(148, 163, 184, 0.25);
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  color: #dbeafe;
  background: rgba(15, 23, 42, 0.72);
}

.primary-button {
  border-color: rgba(52, 211, 153, 0.5);
  color: #022c22;
  background: #34d399;
}

.icon-button {
  cursor: pointer;
}

.icon-button:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.auth-authenticated {
  color: #86efac;
}

.auth-unauthenticated,
.auth-unknown {
  color: #fca5a5;
}

.status-banner {
  margin-bottom: 18px;
  border: 1px solid rgba(251, 113, 133, 0.35);
  border-radius: 8px;
  padding: 12px 14px;
  color: #fecdd3;
  background: rgba(127, 29, 29, 0.32);
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 22px;
}

.metric-card {
  min-height: 132px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 8px;
  padding: 24px;
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr);
  gap: 18px;
  align-items: center;
  background: rgba(15, 31, 45, 0.88);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.02), 0 18px 40px rgba(0, 0, 0, 0.18);
}

.metric-icon {
  width: 54px;
  height: 54px;
  border-radius: 8px;
  display: grid;
  place-items: center;
}

.metric-copy {
  min-width: 0;
}

.metric-label {
  margin: 0;
  color: #94a3b8;
  font-size: 17px;
  font-weight: 700;
}

.metric-value {
  margin: 6px 0 0;
  color: #f8fafc;
  font-size: 32px;
  font-weight: 800;
  line-height: 1.05;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.metric-helper {
  margin: 8px 0 0;
  color: #8ea3b4;
  font-size: 15px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tone-green .metric-icon {
  color: #34d399;
  background: rgba(16, 185, 129, 0.15);
}

.tone-blue .metric-icon {
  color: #60a5fa;
  background: rgba(59, 130, 246, 0.16);
}

.tone-amber .metric-icon {
  color: #fbbf24;
  background: rgba(245, 158, 11, 0.16);
}

.tone-purple .metric-icon {
  color: #c084fc;
  background: rgba(139, 92, 246, 0.18);
}

.tone-rose .metric-icon {
  color: #fb7185;
  background: rgba(244, 63, 94, 0.17);
}

.tone-cyan .metric-icon {
  color: #22d3ee;
  background: rgba(6, 182, 212, 0.16);
}

.spin {
  animation: spin 0.9s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 1180px) {
  .dashboard-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
```

- [ ] **Step 8：运行类型检查和测试**

Run:

```powershell
npm run typecheck
npm test
```

Expected:

```text
退出码 0，没有 TypeScript 错误
PASS tests/formatters.test.ts
PASS tests/dashboardMapper.test.ts
```

- [ ] **Step 9：提交渲染进程界面**

Run:

```powershell
git add src/renderer src/shared src/main/preload.ts
git commit -m "feat: 添加实时看板界面"
```

---

## Task 6：联调运行、登录验证和打包

**Files:**

- Modify: `package.json`
- Modify: `README.md`

- [ ] **Step 1：创建使用说明**

`README.md`：

```md
# AIXW 桌面实时看板

这是一个 Windows 桌面软件，用于登录 AIXW 后每 15 秒刷新当前账号指标。

## 开发运行

```powershell
npm install
npm run dev
```

## 使用方式

1. 启动软件。
2. 点击“登录”。
3. 在弹出的 AIXW 登录窗口完成登录。
4. 返回看板后，软件会每 15 秒刷新一次数据。

## 显示指标

- 余额
- API 密钥数量和启用数量
- 今日请求
- 今日消费
- 今日 Token
- 累计 Token
- 缓存命中率
- 平均响应

## 打包

```powershell
npm run dist
```

打包产物会输出到 `release/` 目录。
```

- [ ] **Step 2：启动开发版桌面应用**

Run:

```powershell
npm run dev
```

Expected:

```text
VITE ready
Electron 窗口打开
```

- [ ] **Step 3：手动验证登录流程**

操作：

1. 点击软件右上角“登录”。
2. 在 AIXW 登录窗口完成登录。
3. 登录窗口关闭后，主窗口展示账号数据。

Expected:

```text
顶部状态显示“已登录”
余额、API 密钥、今日请求等卡片出现真实数据
```

- [ ] **Step 4：验证 15 秒刷新**

操作：

1. 观察顶部倒计时从 `15s` 递减。
2. 倒计时归零后看“最近刷新时间”更新。
3. 点击手动刷新，确认倒计时重置。

Expected:

```text
最近刷新时间更新
刷新失败时出现错误提示，但卡片保留上一次数据
```

- [ ] **Step 5：验证退出登录**

操作：

1. 点击“退出”。
2. 确认状态显示“未登录”。
3. 点击“登录”重新登录。

Expected:

```text
退出后数据清空
重新登录后数据恢复
```

- [ ] **Step 6：打包 Windows 安装包**

Run:

```powershell
npm run dist
```

Expected:

```text
release/ 目录生成 Windows 安装包
```

- [ ] **Step 7：提交说明和打包配置调整**

Run:

```powershell
git add README.md package.json electron-builder.json
git commit -m "docs: 添加运行和打包说明"
```

---

## 自查结果

- 规格覆盖：计划覆盖了 15 秒刷新、登录态读取、余额、API 密钥、请求数、消费、Token、缓存命中率、错误处理、桌面 UI 和 Windows 打包。
- 范围控制：第一版没有加入公开通道状态、API Key 管理、CSV 导出、托盘和多账号。
- 类型一致：共享类型由 `src/shared/dashboardTypes.ts` 定义，主进程和渲染进程都引用同一份类型。
- 测试重点：优先测试格式化、缓存命中率、数据映射，这些是最容易出错且不依赖真实账号的逻辑。


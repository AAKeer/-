import { contextBridge, ipcRenderer } from "electron";
import type { DashboardEnvelope } from "../shared/dashboardTypes.js";

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

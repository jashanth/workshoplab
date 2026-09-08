export interface WindowState {
  id: string;
  title: string;
  icon: string;
  component: string;
  x: number;
  y: number;
  width: number;
  height: number;
  minWidth: number;
  minHeight: number;
  isMinimized: boolean;
  isMaximized: boolean;
  isActive: boolean;
  zIndex: number;
  workspace: number;
  props?: Record<string, unknown>;
}

export interface FSNode {
  name: string;
  type: 'file' | 'directory';
  permissions: string;
  owner: string;
  group: string;
  size: number;
  modified: Date;
  content?: string;
  children?: Record<string, FSNode>;
}

export interface TerminalLine {
  id: string;
  type: 'input' | 'output' | 'error' | 'system';
  content: string;
  timestamp: number;
}

export interface TerminalTheme {
  name: string;
  background: string;
  foreground: string;
  prompt: string;
  cursor: string;
  selection: string;
  black: string;
  red: string;
  green: string;
  yellow: string;
  blue: string;
  magenta: string;
  cyan: string;
  white: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  icon?: string;
  timestamp: number;
  duration?: number;
}

export interface AppSettings {
  wallpaper: string;
  terminalTheme: string;
  terminalFontSize: number;
  cursorStyle: 'block' | 'underline' | 'bar';
  hostname: string;
  username: string;
  accentColor: string;
  showBootAnimation: boolean;
  uiScale: number;
}

export interface ProcessInfo {
  pid: number;
  name: string;
  cpu: number;
  memory: number;
  status: 'running' | 'sleeping' | 'stopped';
  user: string;
}

export interface SystemStats {
  cpu: number;
  memory: number;
  disk: number;
  network: { up: number; down: number };
  uptime: number;
}

export type AppPhase = 'boot' | 'login' | 'desktop';

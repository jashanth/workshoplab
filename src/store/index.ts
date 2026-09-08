import { create } from 'zustand';
import type { WindowState, Notification, AppSettings, ProcessInfo, SystemStats, AppPhase } from '../types';
import type { SessionState } from '../services/session';

export interface ContextMenuItem {
  label: string;
  icon?: string;
  action: () => void;
  separator?: boolean;
  disabled?: boolean;
}

interface StoreState {
  // App phase
  phase: AppPhase;
  setPhase: (phase: AppPhase) => void;

  // Session state (backend connection)
  sessionState: SessionState | null;
  setSessionState: (state: SessionState) => void;

  // Windows
  windows: WindowState[];
  nextZIndex: number;
  openWindow: (config: Omit<WindowState, 'id' | 'zIndex' | 'isMinimized' | 'isMaximized' | 'isActive'>) => string;
  closeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  maximizeWindow: (id: string) => void;
  restoreWindow: (id: string) => void;
  updateWindowPosition: (id: string, x: number, y: number) => void;
  updateWindowSize: (id: string, width: number, height: number) => void;

  // Workspace
  activeWorkspace: number;
  setActiveWorkspace: (ws: number) => void;

  // Notifications
  notifications: Notification[];
  addNotification: (n: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;

  // Settings
  settings: AppSettings;
  updateSettings: (partial: Partial<AppSettings>) => void;

  // System
  systemStats: SystemStats;
  processes: ProcessInfo[];
  updateSystemStats: () => void;

  // Context menu
  contextMenu: { x: number; y: number; items: ContextMenuItem[] } | null;
  showContextMenu: (x: number, y: number, items: ContextMenuItem[]) => void;
  hideContextMenu: () => void;
}

const defaultSettings: AppSettings = {
  wallpaper: 'default',
  terminalTheme: 'kali',
  terminalFontSize: 14,
  cursorStyle: 'block',
  hostname: 'kali',
  username: 'kali',
  accentColor: '#367bf0',
  showBootAnimation: true,
  uiScale: 1,
};

const defaultProcesses: ProcessInfo[] = [
  { pid: 1, name: 'systemd', cpu: 0.1, memory: 0.5, status: 'running', user: 'root' },
  { pid: 2, name: 'kthreadd', cpu: 0, memory: 0, status: 'sleeping', user: 'root' },
  { pid: 234, name: 'dbus-daemon', cpu: 0.2, memory: 1.2, status: 'running', user: 'messagebus' },
  { pid: 412, name: 'NetworkManager', cpu: 0.5, memory: 2.8, status: 'running', user: 'root' },
  { pid: 523, name: 'systemd-logind', cpu: 0.1, memory: 1.1, status: 'sleeping', user: 'root' },
  { pid: 612, name: 'polkitd', cpu: 0.1, memory: 2.4, status: 'sleeping', user: 'polkitd' },
  { pid: 823, name: 'xfce4-session', cpu: 0.8, memory: 4.5, status: 'running', user: 'kali' },
  { pid: 831, name: 'xfwm4', cpu: 1.2, memory: 5.8, status: 'running', user: 'kali' },
  { pid: 845, name: 'xfce4-panel', cpu: 0.6, memory: 3.9, status: 'running', user: 'kali' },
  { pid: 850, name: 'xfdesktop', cpu: 0.4, memory: 3.2, status: 'running', user: 'kali' },
  { pid: 901, name: 'pulseaudio', cpu: 0.3, memory: 2.1, status: 'running', user: 'kali' },
  { pid: 1021, name: 'gnome-terminal', cpu: 1.5, memory: 6.2, status: 'running', user: 'kali' },
  { pid: 1187, name: 'firefox-esr', cpu: 12.3, memory: 18.4, status: 'running', user: 'kali' },
  { pid: 1342, name: 'code', cpu: 8.7, memory: 15.2, status: 'running', user: 'kali' },
  { pid: 1523, name: 'bash', cpu: 0.1, memory: 1.8, status: 'running', user: 'kali' },
];

const loadSettings = (): AppSettings => {
  try {
    const saved = localStorage.getItem('kali-vm-settings');
    if (saved) {
      return { ...defaultSettings, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error('Failed to load settings:', e);
  }
  return defaultSettings;
};

const saveSettings = (settings: AppSettings) => {
  try {
    localStorage.setItem('kali-vm-settings', JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
};

export const useStore = create<StoreState>((set, get) => ({
  // App phase
  phase: 'boot',
  setPhase: (phase) => set({ phase }),

  // Session state (backend connection)
  sessionState: null,
  setSessionState: (sessionState) => set({ sessionState }),

  // Windows
  windows: [],
  nextZIndex: 100,

  openWindow: (config) => {
    const id = crypto.randomUUID ? crypto.randomUUID() : `win-${Date.now()}-${Math.random()}`;
    const { nextZIndex } = get();

    const newWindow: WindowState = {
      ...config,
      id,
      zIndex: nextZIndex,
      isMinimized: false,
      isMaximized: false,
      isActive: true,
    };

    set((state) => ({
      windows: [
        ...state.windows.map(w => ({ ...w, isActive: false })),
        newWindow,
      ],
      nextZIndex: nextZIndex + 1,
    }));

    return id;
  },

  closeWindow: (id) => {
    const { windows } = get();
    const closingWindow = windows.find(w => w.id === id);
    const remainingWindows = windows.filter(w => w.id !== id);

    if (closingWindow?.isActive && remainingWindows.length > 0) {
      const topmost = remainingWindows.reduce((prev, curr) =>
        curr.zIndex > prev.zIndex ? curr : prev
      );
      set({
        windows: remainingWindows.map(w => ({
          ...w,
          isActive: w.id === topmost.id,
        })),
      });
    } else {
      set({ windows: remainingWindows });
    }
  },

  focusWindow: (id) => {
    const { nextZIndex } = get();
    set((state) => ({
      windows: state.windows.map(w =>
        w.id === id
          ? { ...w, isActive: true, zIndex: nextZIndex }
          : { ...w, isActive: false }
      ),
      nextZIndex: nextZIndex + 1,
    }));
  },

  minimizeWindow: (id) => {
    const { windows } = get();
    const minimizingWindow = windows.find(w => w.id === id);

    if (!minimizingWindow) return;

    const updatedWindows = windows.map(w =>
      w.id === id ? { ...w, isMinimized: true, isActive: false } : w
    );

    if (minimizingWindow.isActive) {
      const visibleWindows = updatedWindows.filter(w => !w.isMinimized);
      if (visibleWindows.length > 0) {
        const topmost = visibleWindows.reduce((prev, curr) =>
          curr.zIndex > prev.zIndex ? curr : prev
        );
        set({
          windows: updatedWindows.map(w => ({
            ...w,
            isActive: w.id === topmost.id,
          })),
        });
      } else {
        set({ windows: updatedWindows });
      }
    } else {
      set({ windows: updatedWindows });
    }
  },

  maximizeWindow: (id) => {
    set((state) => ({
      windows: state.windows.map(w =>
        w.id === id ? { ...w, isMaximized: true } : w
      ),
    }));
  },

  restoreWindow: (id) => {
    set((state) => ({
      windows: state.windows.map(w =>
        w.id === id ? { ...w, isMinimized: false, isMaximized: false } : w
      ),
    }));
    get().focusWindow(id);
  },

  updateWindowPosition: (id, x, y) => {
    set((state) => ({
      windows: state.windows.map(w =>
        w.id === id ? { ...w, x, y } : w
      ),
    }));
  },

  updateWindowSize: (id, width, height) => {
    set((state) => ({
      windows: state.windows.map(w =>
        w.id === id ? { ...w, width, height } : w
      ),
    }));
  },

  // Workspace
  activeWorkspace: 1,
  setActiveWorkspace: (ws) => set({ activeWorkspace: ws }),

  // Notifications
  notifications: [],

  addNotification: (notification) => {
    const id = crypto.randomUUID ? crypto.randomUUID() : `notif-${Date.now()}-${Math.random()}`;
    const timestamp = Date.now();
    const duration = notification.duration || 4000;

    const newNotif: Notification = {
      ...notification,
      id,
      timestamp,
    };

    set((state) => ({
      notifications: [...state.notifications, newNotif],
    }));

    setTimeout(() => {
      get().removeNotification(id);
    }, duration);
  },

  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter(n => n.id !== id),
    }));
  },

  // Settings
  settings: loadSettings(),

  updateSettings: (partial) => {
    set((state) => {
      const newSettings = { ...state.settings, ...partial };
      saveSettings(newSettings);
      return { settings: newSettings };
    });
  },

  // System
  systemStats: {
    cpu: 23 + Math.random() * 20,
    memory: 45 + Math.random() * 15,
    disk: 31,
    network: { up: Math.random() * 50, down: Math.random() * 200 },
    uptime: Date.now(),
  },

  processes: defaultProcesses,

  updateSystemStats: () => {
    set((state) => ({
      systemStats: {
        ...state.systemStats,
        cpu: Math.max(5, Math.min(85, state.systemStats.cpu + (Math.random() - 0.5) * 10)),
        memory: Math.max(40, Math.min(65, state.systemStats.memory + (Math.random() - 0.5) * 5)),
        network: {
          up: Math.random() * 100,
          down: Math.random() * 300,
        },
      },
    }));
  },

  // Context menu
  contextMenu: null,

  showContextMenu: (x, y, items) => {
    set({ contextMenu: { x, y, items } });
  },

  hideContextMenu: () => {
    set({ contextMenu: null });
  },
}));

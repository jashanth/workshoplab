import { useStore } from '../store';

interface DockApp {
  id: string;
  name: string;
  icon: string;
  component: string;
  width: number;
  height: number;
}

const DOCK_APPS: DockApp[] = [
  { id: 'terminal', name: 'Terminal', icon: '💻', component: 'Terminal', width: 800, height: 500 },
  { id: 'filemanager', name: 'File Manager', icon: '📁', component: 'FileManager', width: 900, height: 600 },
  { id: 'texteditor', name: 'Text Editor', icon: '📝', component: 'TextEditor', width: 800, height: 600 },
  { id: 'browser', name: 'Browser', icon: '🌐', component: 'Browser', width: 1000, height: 700 },
  { id: 'sysmonitor', name: 'System Monitor', icon: '📊', component: 'SystemMonitor', width: 850, height: 550 },
  { id: 'securitylab', name: 'Security Lab', icon: '🛡️', component: 'SecurityLab', width: 950, height: 650 },
  { id: 'settings', name: 'Settings', icon: '⚙️', component: 'Settings', width: 700, height: 500 },
];

export default function Dock() {
  const windows = useStore((s) => s.windows);
  const openWindow = useStore((s) => s.openWindow);
  const restoreWindow = useStore((s) => s.restoreWindow);
  const focusWindow = useStore((s) => s.focusWindow);
  const activeWorkspace = useStore((s) => s.activeWorkspace);

  const handleAppClick = (app: DockApp) => {
    const existingWindow = windows.find(
      (w) => w.component === app.component && w.workspace === activeWorkspace
    );

    if (existingWindow) {
      if (existingWindow.isMinimized) {
        restoreWindow(existingWindow.id);
      } else {
        focusWindow(existingWindow.id);
      }
    } else {
      openWindow({
        title: app.name,
        icon: app.icon,
        component: app.component,
        x: 100 + Math.random() * 50,
        y: 80 + Math.random() * 50,
        width: app.width,
        height: app.height,
        minWidth: 400,
        minHeight: 300,
        workspace: activeWorkspace,
      });
    }
  };

  const isAppOpen = (componentName: string) => {
    return windows.some(
      (w) => w.component === componentName && w.workspace === activeWorkspace
    );
  };

  return (
    <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40">
      <div className="bg-kali-panel/80 backdrop-blur-md border border-kali-border/50 rounded-2xl px-3 py-2 flex items-center gap-2 shadow-2xl">
        {DOCK_APPS.map((app) => {
          const open = isAppOpen(app.component);
          return (
            <button
              key={app.id}
              onClick={() => handleAppClick(app)}
              className="relative p-2.5 rounded-xl hover:bg-white/10 transition-all hover:scale-110 active:scale-95 group"
              title={app.name}
            >
              <span className="text-2xl block">{app.icon}</span>

              {/* Tooltip */}
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-kali-dark border border-kali-border px-2 py-0.5 rounded text-[10px] text-kali-text opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg">
                {app.name}
              </div>

              {/* Active Indicator */}
              {open && (
                <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-kali-accent rounded-full shadow-[0_0_4px_#00d9ff]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

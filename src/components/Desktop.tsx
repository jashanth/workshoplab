import { useState, useEffect, useCallback, useMemo } from 'react';
import { useStore } from '../store';
import { getFileSystem, saveFileSystem } from '../store/filesystem-store';
import { filesystemEvents } from '../services/filesystem-events';
import TopPanel from './TopPanel';
import WindowManager from './WindowManager';
import Dock from './Dock';
import NotificationCenter from './NotificationCenter';
import DesktopContextMenu from './DesktopContextMenu';

interface DesktopIcon {
  id: string;
  name: string;
  icon: string;
  component: string;
  title: string;
  width?: number;
  height?: number;
  color: string;
}

export default function Desktop() {
  const settings = useStore((s) => s.settings);
  const windows = useStore((s) => s.windows);
  const activeWorkspace = useStore((s) => s.activeWorkspace);
  const openWindow = useStore((s) => s.openWindow);
  const focusWindow = useStore((s) => s.focusWindow);
  const showContextMenu = useStore((s) => s.showContextMenu);
  const hideContextMenu = useStore((s) => s.hideContextMenu);
  const addNotification = useStore((s) => s.addNotification);

  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);
  const [desktopFiles, setDesktopFiles] = useState<any[]>([]);

  // Load desktop files from filesystem
  useEffect(() => {
    const loadDesktopFiles = () => {
      try {
        const fs = getFileSystem();
        const files = fs.getDirectoryContents('/home/kali/Desktop');
        setDesktopFiles(files);
      } catch (error) {
        console.error('[Desktop] Failed to load desktop files:', error);
        setDesktopFiles([]);
      }
    };

    loadDesktopFiles();

    // Subscribe to filesystem changes
    const unsubscribe = filesystemEvents.subscribe((event) => {
      // Reload if change affects Desktop
      if (event.path.startsWith('/home/kali/Desktop')) {
        loadDesktopFiles();
      }
    });

    return unsubscribe;
  }, []);

  const desktopIcons: DesktopIcon[] = useMemo(
    () => [
      {
        id: 'terminal',
        name: 'Terminal',
        icon: '💻',
        component: 'Terminal',
        title: 'Terminal - bash',
        width: 820,
        height: 520,
        color: 'from-blue-600 to-indigo-700',
      },
      {
        id: 'files',
        name: 'File Manager',
        icon: '📁',
        component: 'FileManager',
        title: 'File Manager - /home/kali',
        width: 880,
        height: 560,
        color: 'from-amber-500 to-orange-600',
      },
      {
        id: 'editor',
        name: 'Text Editor',
        icon: '📝',
        component: 'TextEditor',
        title: 'Text Editor - untitled.txt',
        width: 800,
        height: 540,
        color: 'from-emerald-500 to-teal-700',
      },
      {
        id: 'browser',
        name: 'Browser',
        icon: '🌐',
        component: 'Browser',
        title: 'Kali Browser - kali.local',
        width: 950,
        height: 600,
        color: 'from-cyan-500 to-blue-600',
      },
      {
        id: 'tools-launcher',
        name: 'Kali Tools',
        icon: '🛠️',
        component: 'ToolsLauncher',
        title: 'Kali Tools Launcher',
        width: 1000,
        height: 650,
        color: 'from-red-600 to-rose-700',
      },
      {
        id: 'security-lab',
        name: 'Security Lab',
        icon: '🛡️',
        component: 'SecurityLab',
        title: 'Security Lab - Tools & Utilities',
        width: 900,
        height: 580,
        color: 'from-rose-500 to-red-700',
      },
      {
        id: 'system-monitor',
        name: 'System Monitor',
        icon: '📊',
        component: 'SystemMonitor',
        title: 'System Monitor',
        width: 840,
        height: 540,
        color: 'from-violet-500 to-purple-700',
      },
      {
        id: 'settings',
        name: 'Settings',
        icon: '⚙️',
        component: 'Settings',
        title: 'Settings Manager',
        width: 760,
        height: 520,
        color: 'from-slate-500 to-gray-700',
      },
    ],
    []
  );

  const handleOpenApp = useCallback(
    (app: DesktopIcon) => {
      // Check if already open and minimize/focus
      const existing = windows.find((w) => w.component === app.component);
      if (existing) {
        if (existing.isMinimized) {
          useStore.getState().restoreWindow(existing.id);
        } else {
          focusWindow(existing.id);
        }
        return;
      }

      openWindow({
        title: app.title,
        icon: app.icon,
        component: app.component,
        x: Math.max(60, 100 + ((windows.length * 30) % 200)),
        y: Math.max(50, 70 + ((windows.length * 30) % 150)),
        width: app.width || 800,
        height: app.height || 500,
        minWidth: 400,
        minHeight: 300,
        workspace: activeWorkspace,
      });
    },
    [windows, activeWorkspace, openWindow, focusWindow]
  );

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Alt+T -> Open Terminal
      if (e.ctrlKey && e.altKey && (e.key === 't' || e.key === 'T')) {
        e.preventDefault();
        const termApp = desktopIcons.find((i) => i.id === 'terminal');
        if (termApp) handleOpenApp(termApp);
        return;
      }

      // Ctrl+Shift+Esc -> Open System Monitor
      if (e.ctrlKey && e.shiftKey && e.key === 'Escape') {
        e.preventDefault();
        const sysApp = desktopIcons.find((i) => i.id === 'system-monitor');
        if (sysApp) handleOpenApp(sysApp);
        return;
      }

      // Escape -> close context menus
      if (e.key === 'Escape') {
        hideContextMenu();
        setSelectedIcon(null);
        return;
      }

      // Alt+Tab -> Cycle active window
      if (e.altKey && e.key === 'Tab') {
        e.preventDefault();
        const visibleWindows = windows.filter((w) => !w.isMinimized);
        if (visibleWindows.length > 1) {
          const currentIndex = visibleWindows.findIndex((w) => w.isActive);
          const nextIndex = (currentIndex + 1) % visibleWindows.length;
          focusWindow(visibleWindows[nextIndex].id);
        }
        return;
      }

      // PrintScreen -> Take simulated screenshot
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        try {
          const fs = getFileSystem();
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const fileName = `screenshot-${timestamp}.png`;
          fs.touch(`/home/kali/Pictures/${fileName}`, 'Simulated PNG Screenshot Data');
          saveFileSystem();
          addNotification({
            title: 'Screenshot Captured',
            message: `Saved to ~/Pictures/${fileName}`,
            type: 'success',
            icon: '📸',
          });
        } catch {
          addNotification({
            title: 'Screenshot',
            message: 'Screenshot captured to clipboard',
            type: 'info',
            icon: '📸',
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [desktopIcons, handleOpenApp, windows, focusWindow, hideContextMenu, addNotification]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    showContextMenu(e.clientX, e.clientY, []);
  };

  const handleDesktopClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setSelectedIcon(null);
      hideContextMenu();
    }
  };

  // Dynamic Wallpaper styles
  const getWallpaperClasses = () => {
    switch (settings.wallpaper) {
      case 'matrix':
        return 'bg-[#030d05] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-green-950/40 via-black to-black';
      case 'cyberpunk':
        return 'bg-[#0d0718] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-fuchsia-900/30 via-slate-950 to-[#05030a]';
      case 'minimal':
        return 'bg-[#0f141c] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 via-[#0a0d14] to-[#05070a]';
      case 'default':
      default:
        return 'bg-[#080d1e] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-950/40 via-[#0a0f24] to-[#04060d]';
    }
  };

  return (
    <div
      className={`fixed inset-0 overflow-hidden select-none flex flex-col font-sans ${getWallpaperClasses()}`}
      onContextMenu={handleContextMenu}
      onClick={handleDesktopClick}
    >
      {/* Abstract Kali-inspired geometric elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Subtle geometric lines */}
        <svg
          className="absolute right-0 bottom-0 w-[800px] h-[800px] opacity-[0.06] text-cyan-400"
          viewBox="0 0 100 100"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.3"
        >
          <polygon points="50,5 95,25 95,75 50,95 5,75 5,25" />
          <polygon points="50,15 85,30 85,70 50,85 15,70 15,30" />
          <polygon points="50,25 75,37 75,63 50,75 25,63 25,37" />
          <line x1="50" y1="5" x2="50" y2="95" />
          <line x1="5" y1="25" x2="95" y2="75" />
          <line x1="5" y1="75" x2="95" y2="25" />
        </svg>

        {/* Kali Dragon-like stylized abstract shape in center-right */}
        <div className="absolute right-12 bottom-16 w-80 h-80 opacity-[0.03] text-white flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>

        {/* Ambient glow orbs */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-600/[0.04] rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/3 w-[600px] h-[600px] bg-cyan-500/[0.03] rounded-full blur-[140px]" />
      </div>

      {/* Persistent Top Panel */}
      <TopPanel />

      {/* Main Desktop Area */}
      <div className="relative flex-1 p-4 pb-20 overflow-hidden">
        {/* Desktop Icons Grid */}
        <div className="grid grid-flow-col grid-rows-6 gap-3 w-max select-none z-10 relative">
          {/* Application Icons */}
          {desktopIcons.map((icon) => {
            const isSelected = selectedIcon === icon.id;
            return (
              <div
                key={icon.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedIcon(icon.id);
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  handleOpenApp(icon);
                }}
                className={`group flex flex-col items-center justify-center w-20 h-20 p-2 rounded-lg cursor-pointer transition-all duration-150 ${
                  isSelected
                    ? 'bg-blue-600/30 border border-blue-400/50 shadow-md backdrop-blur-sm'
                    : 'hover:bg-white/10 hover:backdrop-blur-sm border border-transparent'
                }`}
              >
                <div className="text-3xl mb-1 filter drop-shadow-md group-hover:scale-110 transition-transform">
                  {icon.icon}
                </div>
                <span className="text-[11px] font-medium text-gray-200 text-center truncate w-full drop-shadow tracking-tight">
                  {icon.name}
                </span>
              </div>
            );
          })}

          {/* Filesystem Items from ~/Desktop */}
          {desktopFiles.map((file) => {
            const fileId = `file-${file.name}`;
            const isSelected = selectedIcon === fileId;
            const fileIcon = file.type === 'directory' ? '📁' : '📄';

            return (
              <div
                key={fileId}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedIcon(fileId);
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  if (file.type === 'directory') {
                    openWindow({
                      title: `File Manager - ${file.name}`,
                      icon: '📁',
                      component: 'FileManager',
                      x: 150,
                      y: 100,
                      width: 880,
                      height: 560,
                      minWidth: 600,
                      minHeight: 400,
                      workspace: activeWorkspace,
                      props: { initialPath: `/home/kali/Desktop/${file.name}` },
                    });
                  } else if (file.name.endsWith('.txt')) {
                    openWindow({
                      title: `Text Editor - ${file.name}`,
                      icon: '📝',
                      component: 'TextEditor',
                      x: 120,
                      y: 90,
                      width: 800,
                      height: 540,
                      minWidth: 400,
                      minHeight: 300,
                      workspace: activeWorkspace,
                      props: { filePath: `/home/kali/Desktop/${file.name}` },
                    });
                  }
                }}
                className={`group flex flex-col items-center justify-center w-20 h-20 p-2 rounded-lg cursor-pointer transition-all duration-150 ${
                  isSelected
                    ? 'bg-blue-600/30 border border-blue-400/50 shadow-md backdrop-blur-sm'
                    : 'hover:bg-white/10 hover:backdrop-blur-sm border border-transparent'
                }`}
              >
                <div className="text-3xl mb-1 filter drop-shadow-md group-hover:scale-110 transition-transform">
                  {fileIcon}
                </div>
                <span className="text-[11px] font-medium text-gray-200 text-center truncate w-full drop-shadow tracking-tight">
                  {file.name}
                </span>
              </div>
            );
          })}
        </div>

        {/* Window Manager Workspace View */}
        <WindowManager />
      </div>

      {/* Bottom Dock */}
      <Dock />

      {/* Context Menu Overlay */}
      <DesktopContextMenu />

      {/* Desktop Notification Area */}
      <NotificationCenter />
    </div>
  );
}

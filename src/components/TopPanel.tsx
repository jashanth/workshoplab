import { useState, useEffect } from 'react';
import { useStore } from '../store';
import { AuthService } from '../services/auth';

export default function TopPanel() {
  const [time, setTime] = useState(new Date());
  const [showAppsMenu, setShowAppsMenu] = useState(false);
  const [showPowerMenu, setShowPowerMenu] = useState(false);
  const [showNetworkPopup, setShowNetworkPopup] = useState(false);

  const windows = useStore((s) => s.windows);
  const activeWorkspace = useStore((s) => s.activeWorkspace);
  const setActiveWorkspace = useStore((s) => s.setActiveWorkspace);
  const openWindow = useStore((s) => s.openWindow);
  const setPhase = useStore((s) => s.setPhase);
  const sessionState = useStore((s) => s.sessionState);
  const addNotification = useStore((s) => s.addNotification);

  const activeWindow = windows.find((w) => w.isActive && !w.isMinimized);
  const isOnline = sessionState?.mode === 'online';
  const connectionStatus = sessionState?.connectionStatus || 'disconnected';

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const openTerminal = () => {
    openWindow({
      title: 'Terminal',
      icon: '💻',
      component: 'Terminal',
      x: 100,
      y: 80,
      width: 800,
      height: 500,
      minWidth: 400,
      minHeight: 300,
      workspace: activeWorkspace,
    });
  };

  const openFileManager = () => {
    openWindow({
      title: 'File Manager',
      icon: '📁',
      component: 'FileManager',
      x: 150,
      y: 100,
      width: 900,
      height: 600,
      minWidth: 600,
      minHeight: 400,
      workspace: activeWorkspace,
      props: { initialPath: '/home/kali' },
    });
  };

  const openBrowser = () => {
    openWindow({
      title: 'Browser',
      icon: '🌐',
      component: 'Browser',
      x: 120,
      y: 90,
      width: 1000,
      height: 700,
      minWidth: 600,
      minHeight: 400,
      workspace: activeWorkspace,
    });
  };

  const handlePowerAction = (action: string) => {
    setShowPowerMenu(false);
    switch (action) {
      case 'lock':
        AuthService.logout();
        addNotification({
          title: 'Session Locked',
          message: 'Screen locked. Please log in again.',
          type: 'info',
        });
        setPhase('login');
        break;
      case 'logout':
        AuthService.logout();
        addNotification({
          title: 'Logged Out',
          message: 'Session ended successfully',
          type: 'info',
        });
        setPhase('login');
        break;
      case 'restart':
        AuthService.logout();
        addNotification({
          title: 'Restarting',
          message: 'Virtual machine is restarting...',
          type: 'info',
        });
        setPhase('boot');
        setTimeout(() => setPhase('login'), 3500);
        break;
      case 'shutdown':
        AuthService.logout();
        addNotification({
          title: 'Shutting Down',
          message: 'Virtual machine is powering off...',
          type: 'info',
        });
        // Show boot screen as shutdown screen
        setPhase('boot');
        // After 2 seconds, show the actual shutdown state
        setTimeout(() => {
          // You could create a shutdown phase here
          setPhase('login');
        }, 2000);
        break;
    }
  };

  return (
    <>
      <div className="fixed top-0 left-0 right-0 h-8 bg-kali-panel border-b border-kali-border flex items-center justify-between px-2 z-50">
        {/* Left section */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAppsMenu(!showAppsMenu)}
            className="px-3 py-1 hover:bg-white/10 rounded text-sm font-medium text-kali-text transition-colors flex items-center gap-1.5"
          >
            <span className="text-base">🐉</span>
            <span>Applications</span>
          </button>

          <div className="w-px h-5 bg-kali-border" />

          <button
            onClick={openTerminal}
            className="p-1.5 hover:bg-white/10 rounded transition-colors"
            title="Terminal"
          >
            <span className="text-base">💻</span>
          </button>
          <button
            onClick={openFileManager}
            className="p-1.5 hover:bg-white/10 rounded transition-colors"
            title="File Manager"
          >
            <span className="text-base">📁</span>
          </button>
          <button
            onClick={openBrowser}
            className="p-1.5 hover:bg-white/10 rounded transition-colors"
            title="Browser"
          >
            <span className="text-base">🌐</span>
          </button>

          <div className="w-px h-5 bg-kali-border ml-1" />

          <div className="flex gap-1 ml-1">
            {[1, 2, 3, 4].map((ws) => (
              <button
                key={ws}
                onClick={() => setActiveWorkspace(ws)}
                className={`w-6 h-6 rounded text-xs font-medium transition-colors ${
                  ws === activeWorkspace
                    ? 'bg-kali-primary text-white'
                    : 'bg-white/5 text-kali-text/60 hover:bg-white/10'
                }`}
              >
                {ws}
              </button>
            ))}
          </div>
        </div>

        {/* Center section */}
        <div className="text-sm text-kali-text/80 font-medium">
          {activeWindow?.title || ''}
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setShowNetworkPopup(!showNetworkPopup)}
              className="p-1.5 hover:bg-white/10 rounded transition-colors"
              title="Network"
            >
              <span className="text-base">📶</span>
            </button>
            {showNetworkPopup && (
              <div className="absolute top-full right-0 mt-1 bg-kali-panel border border-kali-border rounded shadow-lg p-3 text-xs text-kali-text min-w-[200px]">
                <div className="font-semibold mb-2">Network Connected</div>
                <div className="space-y-1 text-kali-text/70">
                  <div>eth0: 192.168.56.101</div>
                  <div>Gateway: 192.168.56.1</div>
                  <div className="text-green-400 mt-2">● Active</div>
                </div>
              </div>
            )}
          </div>

          <button className="p-1.5 hover:bg-white/10 rounded transition-colors" title="Volume">
            <span className="text-base">🔊</span>
          </button>

          <button className="p-1.5 hover:bg-white/10 rounded transition-colors" title="Battery: 85%">
            <span className="text-base">🔋</span>
          </button>

          <div className="w-px h-5 bg-kali-border" />

          {/* Backend Connection Status */}
          <div className="flex items-center gap-1.5 px-2">
            <div
              className={`w-2 h-2 rounded-full ${
                isOnline && connectionStatus === 'connected'
                  ? 'bg-green-500'
                  : isOnline && connectionStatus === 'connecting'
                  ? 'bg-yellow-500 animate-pulse'
                  : 'bg-gray-500'
              }`}
              title={`Backend: ${isOnline ? connectionStatus : 'offline'}`}
            />
            <span className="text-xs text-kali-text/70">
              {isOnline ? (connectionStatus === 'connected' ? 'Online' : 'Connecting') : 'Offline'}
            </span>
          </div>

          <div className="w-px h-5 bg-kali-border" />

          <div className="relative">
            <button
              onClick={() => setShowPowerMenu(!showPowerMenu)}
              className="p-1.5 hover:bg-white/10 rounded transition-colors"
              title="Power"
            >
              <span className="text-base">⏻</span>
            </button>
            {showPowerMenu && (
              <div className="absolute top-full right-0 mt-1 bg-kali-panel border border-kali-border rounded shadow-lg py-1 text-xs min-w-[140px]">
                <button
                  onClick={() => handlePowerAction('lock')}
                  className="w-full px-3 py-2 hover:bg-white/10 text-left text-kali-text transition-colors"
                >
                  🔒 Lock
                </button>
                <button
                  onClick={() => handlePowerAction('logout')}
                  className="w-full px-3 py-2 hover:bg-white/10 text-left text-kali-text transition-colors"
                >
                  🚪 Log Out
                </button>
                <div className="h-px bg-kali-border my-1" />
                <button
                  onClick={() => handlePowerAction('restart')}
                  className="w-full px-3 py-2 hover:bg-white/10 text-left text-kali-text transition-colors"
                >
                  🔄 Restart
                </button>
                <button
                  onClick={() => handlePowerAction('shutdown')}
                  className="w-full px-3 py-2 hover:bg-white/10 text-left text-kali-text transition-colors"
                >
                  ⏻ Shutdown
                </button>
              </div>
            )}
          </div>

          <div className="text-sm text-kali-text/90 font-medium pl-2">{formatTime(time)}</div>
        </div>
      </div>

      {showAppsMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowAppsMenu(false)}
        />
      )}
    </>
  );
}

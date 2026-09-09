import { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { AuthService } from '../services/auth';
import { restartVM, shutdownVM } from '../services/vm-actions';

export default function LoginScreen() {
  const setPhase = useStore((s) => s.setPhase);
  const poweredOff = useStore((s) => s.poweredOff);
  const setPoweredOff = useStore((s) => s.setPoweredOff);
  const settings = useStore((s) => s.settings);
  const addNotification = useStore((s) => s.addNotification);

  const [username, setUsername] = useState(settings.username || 'kali');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showPowerDialog, setShowPowerDialog] = useState(false);

  const powerMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    setError('');
    setIsLoading(true);

    try {
      const result = await AuthService.login({ username, password });

      if (result.success) {
        AuthService.setCurrentUser(result.user!);
        addNotification({
          title: 'Authentication Successful',
          message: `Logged in as ${result.user}@${settings.hostname || 'kali'}`,
          type: 'success',
        });
        setPhase('desktop');
      } else {
        setError(result.message || 'Login failed');
      }
    } catch (err) {
      setError('Authentication error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = () => {
    AuthService.setCurrentUser('guest');
    addNotification({
      title: 'Guest Session',
      message: 'Logged in as guest user (temporary session)',
      type: 'info',
    });
    setPhase('desktop');
  };

  const handleRestart = () => {
    setShowPowerDialog(false);
    restartVM();
  };

  // Click-outside to close power menu
  useEffect(() => {
    if (!showPowerDialog) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        powerMenuRef.current &&
        !powerMenuRef.current.contains(e.target as Node)
      ) {
        setShowPowerDialog(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPowerDialog]);

  const handleShutdown = () => {
    shutdownVM();
  };

  const handlePowerOn = () => {
    setPoweredOff(false);
    setPhase('boot');
  };

  if (poweredOff) {
    return (
      <div className="login-screen fixed inset-0 bg-black flex flex-col items-center justify-center text-gray-500 font-mono select-none z-50">
        <div className="text-4xl mb-4 opacity-50">⏻</div>
        <p className="text-sm mb-6">Virtual Machine is powered off.</p>
        <button
          onClick={handlePowerOn}
          className="px-6 py-2.5 bg-kali-panel hover:bg-blue-600/30 border border-kali-border hover:border-kali-primary text-gray-200 rounded-lg text-sm font-medium transition-all shadow-lg flex items-center gap-2"
        >
          <span>⏻</span>
          <span>Power On VM</span>
        </button>
      </div>
    );
  }

  const formatClock = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="login-screen fixed inset-0 bg-[#070b19] text-gray-100 flex flex-col justify-between select-none z-50 overflow-hidden relative font-sans">
      {/* Background Graphic elements */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-black pointer-events-none" />
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Subtle grid lines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293d0a_1px,transparent_1px),linear-gradient(to_bottom,#1f293d0a_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      {/* Top status bar */}
      <div className="relative z-10 flex justify-between items-center px-6 py-3 bg-black/30 backdrop-blur-md border-b border-white/5 text-xs text-gray-400">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-cyan-400" />
          <span className="font-mono">{settings.hostname || 'kali'}</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5" title="Network Connected">
            <span className="text-green-400">●</span>
            <span className="font-mono">eth0: 192.168.56.101</span>
          </div>
          <div className="font-mono text-gray-300">{formatClock(currentTime)}</div>
          <div className="relative">
            <button
              onClick={() => setShowPowerDialog(!showPowerDialog)}
              className="p-1.5 hover:bg-white/10 rounded transition-colors text-gray-300 hover:text-white"
              title="Power Options"
            >
              ⏻
            </button>
            {showPowerDialog && (
              <div className="absolute right-0 top-full mt-2 w-40 bg-[#121626] border border-gray-800 rounded-lg shadow-xl py-1 text-xs z-50">
                <button
                  onClick={handleRestart}
                  className="w-full px-3 py-2 text-left hover:bg-white/10 text-gray-300 flex items-center gap-2"
                >
                  <span>🔄</span> Restart VM
                </button>
                <button
                  onClick={handleShutdown}
                  className="w-full px-3 py-2 text-left hover:bg-red-500/20 text-red-400 flex items-center gap-2"
                >
                  <span>⏻</span> Shut Down
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Center login panel */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-4">
        {/* Large clock */}
        <div className="text-center mb-8">
          <div className="text-4xl md:text-5xl font-light tracking-wider font-mono text-gray-100">
            {formatClock(currentTime).slice(0, 5)}
          </div>
          <div className="text-xs md:text-sm text-gray-400 mt-1 font-sans">
            {formatDate(currentTime)}
          </div>
        </div>

        {/* Card */}
        <div className="w-full max-w-sm bg-[#12172b]/80 backdrop-blur-xl border border-blue-500/20 rounded-2xl shadow-2xl p-6 sm:p-8 flex flex-col items-center">
          {/* Kali Shield / Avatar */}
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 p-0.5 shadow-lg shadow-blue-500/20 mb-4 flex items-center justify-center">
            <div className="w-full h-full bg-[#0d1224] rounded-[14px] flex items-center justify-center">
              <svg className="w-10 h-10 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
          </div>

          <h1 className="text-lg font-bold text-gray-100 mb-1 tracking-wide">KALI WEB VM</h1>
          <p className="text-xs text-blue-400 font-mono mb-6">Rolling Release • 2026.1</p>

          <form onSubmit={handleLogin} className="w-full space-y-4">
            <div>
              <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(''); }}
                className="w-full px-3.5 py-2 bg-black/40 border border-gray-700/80 rounded-lg text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono transition-colors"
                placeholder="kali"
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                className="w-full px-3.5 py-2 bg-black/40 border border-gray-700/80 rounded-lg text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono transition-colors"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="text-xs text-red-400 bg-red-950/40 border border-red-800/60 rounded px-2.5 py-1.5 text-center">
                {error}
              </div>
            )}

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold shadow-lg shadow-blue-600/30 transition-all active:scale-[0.99] flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin">⚙</span>
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span>Log In</span>
                    <span>→</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleGuestLogin}
                className="w-full py-2 px-4 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-lg text-xs font-medium border border-white/5 transition-colors"
              >
                Guest Session
              </button>
            </div>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-800/80 w-full text-center">
            <span className="text-[11px] text-gray-500 font-mono">
              Default credentials: <span className="text-blue-400">kali</span> / <span className="text-blue-400">kali</span>
            </span>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="relative z-10 px-6 py-3 flex justify-between items-center text-xs text-gray-500">
        <div>Kali Linux VM Simulation</div>
        <div className="flex gap-4">
          <button onClick={handleRestart} className="hover:text-gray-300 transition-colors">
            Restart
          </button>
          <button onClick={handleShutdown} className="hover:text-red-400 transition-colors">
            Shut Down
          </button>
        </div>
      </div>
    </div>
  );
}

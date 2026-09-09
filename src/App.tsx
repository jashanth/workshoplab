import React, { useEffect } from 'react';
import { useStore } from './store';
import { sessionManager } from './services/session';
import BootScreen from './components/BootScreen';
import LoginScreen from './components/LoginScreen';
import Desktop from './components/Desktop';

export const App: React.FC = () => {
  const { phase, updateSystemStats, setSessionState } = useStore();

  // Initialize session manager
  useEffect(() => {
    const initSession = async () => {
      try {
        const mode = await sessionManager.initialize();
        console.log(`[App] Session initialized in ${mode} mode`);

        // Subscribe to session state changes
        sessionManager.onStateChange((state) => {
          setSessionState(state);
        });

        // Set initial state
        setSessionState(sessionManager.getState());
      } catch (error) {
        console.error('[App] Failed to initialize session:', error);
        // Fallback to offline mode
        setSessionState({
          mode: 'offline',
          sessionInfo: null,
          connectionStatus: 'disconnected',
          error: null,
        });
      }
    };

    initSession();

    // Cleanup on unmount
    return () => {
      sessionManager.cleanup();
    };
  }, [setSessionState]);

  // Update system stats periodically
  useEffect(() => {
    const interval = setInterval(() => {
      updateSystemStats();
    }, 3000);
    return () => clearInterval(interval);
  }, [updateSystemStats]);

  return (
    <div className="w-screen h-screen overflow-hidden select-none bg-black">
      {phase === 'boot' && <BootScreen />}
      {phase === 'login' && <LoginScreen />}
      {phase === 'desktop' && <Desktop />}
    </div>
  );
};

export default App;

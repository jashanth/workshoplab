import { useState, useEffect } from 'react';
import { useStore } from '../store';

const bootLogs = [
  { text: 'Starting Kali Web VM (Linux version 6.5.0-kali3-amd64)...', type: 'info', delay: 200 },
  { text: '[  OK  ] Created slice system.slice - System Slice.', type: 'ok', delay: 400 },
  { text: '[  OK  ] Initializing Virtual File System (tmpfs, rootfs, ext4)...', type: 'ok', delay: 700 },
  { text: '[  OK  ] Reached target System Initialization.', type: 'ok', delay: 1000 },
  { text: '[  OK  ] Started D-Bus System Message Bus.', type: 'ok', delay: 1300 },
  { text: '[  OK  ] Started Network Manager (eth0, wlan0).', type: 'ok', delay: 1600 },
  { text: '[  OK  ] Started Simulated Security Daemon & Services.', type: 'ok', delay: 1900 },
  { text: '[  OK  ] Loading XFCE4 / Kali Desktop Environment...', type: 'ok', delay: 2200 },
  { text: '[  OK  ] Starting X11 Display Server on :0 (tty7)...', type: 'ok', delay: 2600 },
  { text: '[  OK  ] Starting LightDM Display Manager & User Session...', type: 'ok', delay: 3000 },
  { text: '[  OK  ] Boot sequence complete. Welcome to Kali Linux.', type: 'ok', delay: 3400 },
];

export default function BootScreen() {
  const setPhase = useStore((s) => s.setPhase);
  const settings = useStore((s) => s.settings);
  const [lines, setLines] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!settings.showBootAnimation) {
      setPhase('login');
      return;
    }

    const timers: ReturnType<typeof setTimeout>[] = [];

    bootLogs.forEach((log, index) => {
      const timer = setTimeout(() => {
        setLines((prev) => [...prev, log.text]);
        setProgress(Math.round(((index + 1) / bootLogs.length) * 100));
      }, log.delay);
      timers.push(timer);
    });

    const completeTimer = setTimeout(() => {
      setPhase('login');
    }, 3800);
    timers.push(completeTimer);

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [setPhase, settings.showBootAnimation]);

  const handleSkip = () => {
    setPhase('login');
  };

  return (
    <div className="fixed inset-0 bg-black text-white font-mono flex flex-col justify-between p-6 select-none z-50 overflow-hidden">
      {/* Top action bar */}
      <div className="flex justify-between items-center text-xs text-gray-500 border-b border-gray-800 pb-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span>Kali Linux VM 6.5.0-kali3-amd64 (tty1)</span>
        </div>
        <button
          onClick={handleSkip}
          className="px-3 py-1 bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-white rounded border border-gray-700 transition-colors flex items-center gap-1 text-xs"
        >
          <span>Skip Boot</span>
          <span>»</span>
        </button>
      </div>

      {/* Boot terminal log output */}
      <div className="flex-1 my-4 overflow-y-auto space-y-1 text-xs md:text-sm text-gray-300">
        {lines.map((line, idx) => (
          <div key={idx} className="boot-line flex items-start gap-2">
            {line.startsWith('[  OK  ]') ? (
              <>
                <span className="text-green-400 font-bold">[  OK  ]</span>
                <span className="text-gray-200">{line.replace('[  OK  ]', '')}</span>
              </>
            ) : (
              <span className="text-blue-400">{line}</span>
            )}
          </div>
        ))}
        <div className="inline-block w-2 h-4 bg-white cursor-blink ml-1 align-middle" />
      </div>

      {/* Bottom Progress Bar & System Status */}
      <div className="border-t border-gray-800 pt-3 flex flex-col gap-2">
        <div className="flex justify-between text-xs text-gray-400">
          <span>Booting system components...</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full bg-gray-900 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-kali-primary h-full transition-all duration-200 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="text-[10px] text-gray-600 text-center">
          Kali Web VM — Educational Browser-Based Linux Simulation
        </div>
      </div>
    </div>
  );
}

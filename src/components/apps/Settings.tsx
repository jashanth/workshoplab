import React, { useState } from 'react';
import { useStore } from '../../store';

interface Tab {
  id: string;
  title: string;
  selected: boolean;
}

const Settings: React.FC = () => {
  const { settings, updateSettings } = useStore();
  const [activeTab, setActiveTab] = useState<string>('appearance');

  const tabs: Tab[] = [
    { id: 'appearance', title: 'Appearance', selected: activeTab === 'appearance' },
    { id: 'terminal', title: 'Terminal', selected: activeTab === 'terminal' },
    { id: 'system', title: 'System', selected: activeTab === 'system' },
    { id: 'about', title: 'About', selected: activeTab === 'about' },
  ];

  const wallpapers = [
    { id: 'default', name: 'Kali Dark Blue' },
    { id: 'matrix', name: 'Matrix Rain' },
    { id: 'cyberpunk', name: 'Cyberpunk Purple' },
    { id: 'minimal', name: 'Deep Minimal' },
  ];

  const themes = ['kali', 'matrix', 'dracula', 'ubuntu', 'classic', 'highContrast'];

  const handleReset = () => {
    if (confirm('Reset the entire virtual machine? All files and settings will be lost.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 text-gray-100">
      {/* Tabs */}
      <div className="flex border-b border-gray-700 bg-gray-800">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 font-medium transition-colors ${
              tab.selected
                ? 'bg-gray-900 text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-750'
            }`}
          >
            {tab.title}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'appearance' && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h3 className="text-lg font-semibold mb-3">Wallpaper</h3>
              <div className="grid grid-cols-2 gap-3">
                {wallpapers.map((wp) => (
                  <button
                    key={wp.id}
                    onClick={() => updateSettings({ wallpaper: wp.id })}
                    className={`p-4 rounded border-2 transition-colors ${
                      settings.wallpaper === wp.id
                        ? 'border-blue-500 bg-blue-900/30'
                        : 'border-gray-700 hover:border-gray-600 bg-gray-800'
                    }`}
                  >
                    {wp.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Accent Color</h3>
              <input
                type="color"
                value={settings.accentColor}
                onChange={(e) => updateSettings({ accentColor: e.target.value })}
                className="w-24 h-12 rounded cursor-pointer"
              />
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">UI Scale</h3>
              <input
                type="range"
                min="0.8"
                max="1.2"
                step="0.1"
                value={settings.uiScale}
                onChange={(e) => updateSettings({ uiScale: parseFloat(e.target.value) })}
                className="w-full"
              />
              <div className="text-sm text-gray-400 mt-1">{(settings.uiScale * 100).toFixed(0)}%</div>
            </div>
          </div>
        )}

        {activeTab === 'terminal' && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h3 className="text-lg font-semibold mb-3">Terminal Theme</h3>
              <div className="grid grid-cols-2 gap-3">
                {themes.map((theme) => (
                  <button
                    key={theme}
                    onClick={() => updateSettings({ terminalTheme: theme })}
                    className={`p-3 rounded border-2 transition-colors text-left ${
                      settings.terminalTheme === theme
                        ? 'border-blue-500 bg-blue-900/30'
                        : 'border-gray-700 hover:border-gray-600 bg-gray-800'
                    }`}
                  >
                    {theme}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Font Size</h3>
              <input
                type="range"
                min="10"
                max="20"
                value={settings.terminalFontSize}
                onChange={(e) => updateSettings({ terminalFontSize: parseInt(e.target.value, 10) })}
                className="w-full"
              />
              <div className="text-sm text-gray-400 mt-1">{settings.terminalFontSize}px</div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Cursor Style</h3>
              <div className="flex gap-3">
                {(['block', 'underline', 'bar'] as const).map((style) => (
                  <button
                    key={style}
                    onClick={() => updateSettings({ cursorStyle: style })}
                    className={`px-4 py-2 rounded border-2 transition-colors capitalize ${
                      settings.cursorStyle === style
                        ? 'border-blue-500 bg-blue-900/30'
                        : 'border-gray-700 hover:border-gray-600 bg-gray-800'
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'system' && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h3 className="text-lg font-semibold mb-3">System Information</h3>
              <div className="space-y-2 bg-gray-800 p-4 rounded font-mono text-sm">
                <div><span className="text-gray-400">Hostname:</span> {settings.hostname}</div>
                <div><span className="text-gray-400">Username:</span> {settings.username}</div>
                <div><span className="text-gray-400">Shell:</span> /bin/bash</div>
                <div><span className="text-gray-400">Kernel:</span> Linux 6.5.0-kali3-amd64</div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Boot Animation</h3>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showBootAnimation}
                  onChange={(e) => updateSettings({ showBootAnimation: e.target.checked })}
                  className="w-5 h-5"
                />
                <span>Show boot sequence on startup</span>
              </label>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3 text-red-400">Danger Zone</h3>
              <button
                onClick={handleReset}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded font-medium transition-colors"
              >
                Reset Virtual Machine
              </button>
              <p className="text-sm text-gray-400 mt-2">
                This will delete all files, settings, and command history. This action cannot be undone.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'about' && (
          <div className="space-y-6 max-w-2xl">
            <div className="text-center space-y-4">
              <div className="text-6xl">🐉</div>
              <h2 className="text-3xl font-bold">Kali Web VM</h2>
              <p className="text-xl text-gray-400">Version 1.0.0</p>
            </div>

            <div className="bg-gray-800 p-6 rounded space-y-3">
              <h3 className="text-lg font-semibold mb-3">System Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-400">Platform</div>
                  <div className="font-mono">Browser Virtual Machine</div>
                </div>
                <div>
                  <div className="text-gray-400">Architecture</div>
                  <div className="font-mono">x86_64</div>
                </div>
                <div>
                  <div className="text-gray-400">Memory</div>
                  <div className="font-mono">4 GB (simulated)</div>
                </div>
                <div>
                  <div className="text-gray-400">Storage</div>
                  <div className="font-mono">Virtual Filesystem</div>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 p-6 rounded">
              <h3 className="text-lg font-semibold mb-3">Built With</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>• React 18</li>
                <li>• TypeScript</li>
                <li>• Tailwind CSS</li>
                <li>• Zustand (State Management)</li>
                <li>• Vite (Build Tool)</li>
              </ul>
            </div>

            <div className="text-center text-sm text-gray-400 pt-4 border-t border-gray-700">
              <p>Educational simulation of a Kali Linux desktop environment.</p>
              <p className="mt-2">All commands and tools are simulated for learning purposes.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;

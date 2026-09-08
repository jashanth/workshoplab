import { useState } from 'react';
import { useStore } from '../store';

interface AppItem {
  id: string;
  name: string;
  icon: string;
  category: string;
  description: string;
  component: string;
  defaultWidth?: number;
  defaultHeight?: number;
}

const APPS: AppItem[] = [
  {
    id: 'terminal',
    name: 'Terminal',
    icon: '💻',
    category: 'Favorites',
    description: 'Command line terminal emulator',
    component: 'Terminal',
    defaultWidth: 800,
    defaultHeight: 500,
  },
  {
    id: 'filemanager',
    name: 'File Manager',
    icon: '📁',
    category: 'Favorites',
    description: 'Browse and manage files',
    component: 'FileManager',
    defaultWidth: 900,
    defaultHeight: 600,
  },
  {
    id: 'texteditor',
    name: 'Text Editor',
    icon: '📝',
    category: 'Favorites',
    description: 'Simple text and code editor',
    component: 'TextEditor',
    defaultWidth: 800,
    defaultHeight: 600,
  },
  {
    id: 'browser',
    name: 'Web Browser',
    icon: '🌐',
    category: 'Favorites',
    description: 'Browse local simulation pages',
    component: 'Browser',
    defaultWidth: 1000,
    defaultHeight: 700,
  },
  {
    id: 'sysmonitor',
    name: 'System Monitor',
    icon: '📊',
    category: 'Favorites',
    description: 'Monitor system resources and processes',
    component: 'SystemMonitor',
    defaultWidth: 850,
    defaultHeight: 550,
  },
  {
    id: 'securitylab',
    name: 'Security Lab',
    icon: '🛡️',
    category: 'Information Gathering',
    description: 'Educational cybersecurity tools and simulators',
    component: 'SecurityLab',
    defaultWidth: 950,
    defaultHeight: 650,
  },
  {
    id: 'settings',
    name: 'Settings',
    icon: '⚙️',
    category: 'System',
    description: 'System and appearance settings',
    component: 'Settings',
    defaultWidth: 700,
    defaultHeight: 500,
  },
  {
    id: 'about',
    name: 'About Kali Web VM',
    icon: 'ℹ️',
    category: 'System',
    description: 'System information and credits',
    component: 'About',
    defaultWidth: 500,
    defaultHeight: 400,
  },
];

const CATEGORIES = [
  'Favorites',
  'All Applications',
  'Information Gathering',
  'System',
  'Accessories',
];

interface ApplicationsMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ApplicationsMenu({ isOpen, onClose }: ApplicationsMenuProps) {
  const [selectedCategory, setSelectedCategory] = useState('Favorites');
  const [searchQuery, setSearchQuery] = useState('');

  const openWindow = useStore((s) => s.openWindow);
  const activeWorkspace = useStore((s) => s.activeWorkspace);
  const setPhase = useStore((s) => s.setPhase);

  if (!isOpen) return null;

  const filteredApps = APPS.filter((app) => {
    const matchesSearch =
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.description.toLowerCase().includes(searchQuery.toLowerCase());

    if (searchQuery) return matchesSearch;

    if (selectedCategory === 'All Applications') return true;
    return app.category === selectedCategory;
  });

  const handleOpenApp = (app: AppItem) => {
    openWindow({
      title: app.name,
      icon: app.icon,
      component: app.component,
      x: 100 + Math.random() * 50,
      y: 80 + Math.random() * 50,
      width: app.defaultWidth || 800,
      height: app.defaultHeight || 500,
      minWidth: 400,
      minHeight: 300,
      workspace: activeWorkspace,
    });
    onClose();
  };

  return (
    <div className="fixed top-8 left-0 w-[600px] h-[500px] bg-kali-panel border border-kali-border shadow-2xl rounded-br-lg z-50 flex flex-col">
      {/* Search Bar */}
      <div className="p-3 border-b border-kali-border">
        <input
          type="text"
          placeholder="Type to search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 bg-kali-dark border border-kali-border rounded text-sm text-kali-text focus:outline-none focus:border-kali-primary"
          autoFocus
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Categories Sidebar */}
        <div className="w-48 border-r border-kali-border p-2 space-y-1 overflow-y-auto">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setSearchQuery('');
              }}
              className={`w-full text-left px-3 py-2 rounded text-xs transition-colors ${
                selectedCategory === cat && !searchQuery
                  ? 'bg-kali-primary text-white font-medium'
                  : 'text-kali-text/70 hover:bg-white/5 hover:text-kali-text'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Apps Grid */}
        <div className="flex-1 p-3 grid grid-cols-2 gap-2 overflow-y-auto content-start">
          {filteredApps.map((app) => (
            <button
              key={app.id}
              onClick={() => handleOpenApp(app)}
              className="flex items-start gap-3 p-2.5 rounded hover:bg-white/5 border border-transparent hover:border-kali-border text-left transition-all group"
            >
              <span className="text-2xl flex-shrink-0 group-hover:scale-110 transition-transform">
                {app.icon}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-kali-text group-hover:text-kali-accent">
                  {app.name}
                </div>
                <div className="text-xs text-kali-text/50 truncate">
                  {app.description}
                </div>
              </div>
            </button>
          ))}

          {filteredApps.length === 0 && (
            <div className="col-span-2 text-center text-kali-text/40 py-8 text-sm">
              No applications found
            </div>
          )}
        </div>
      </div>

      {/* Footer / Power Controls */}
      <div className="p-2 border-t border-kali-border flex justify-between items-center bg-black/20 text-xs">
        <div className="text-kali-text/50 px-2">Kali Web VM v1.0</div>
        <div className="flex gap-1">
          <button
            onClick={() => {
              setPhase('login');
              onClose();
            }}
            className="p-1.5 hover:bg-white/10 rounded text-kali-text/70 hover:text-kali-text"
            title="Lock"
          >
            🔒
          </button>
          <button
            onClick={() => {
              setPhase('boot');
              onClose();
            }}
            className="p-1.5 hover:bg-white/10 rounded text-kali-text/70 hover:text-kali-text"
            title="Restart"
          >
            🔄
          </button>
        </div>
      </div>
    </div>
  );
}

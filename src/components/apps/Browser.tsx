import React, { useState } from 'react';

interface Tab {
  id: string;
  url: string;
  title: string;
  history: string[];
  historyIndex: number;
}

const Browser: React.FC = () => {
  const [tabs, setTabs] = useState<Tab[]>([
    { id: '1', url: 'kali.local', title: 'Kali Web VM', history: ['kali.local'], historyIndex: 0 }
  ]);
  const [activeTabId, setActiveTabId] = useState('1');
  const [inputUrl, setInputUrl] = useState('kali.local');

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

  const addTab = () => {
    const newId = Date.now().toString();
    setTabs([...tabs, { id: newId, url: 'kali.local', title: 'New Tab', history: ['kali.local'], historyIndex: 0 }]);
    setActiveTabId(newId);
    setInputUrl('kali.local');
  };

  const closeTab = (id: string) => {
    const newTabs = tabs.filter(t => t.id !== id);
    if (newTabs.length === 0) {
      addTab();
      return;
    }
    setTabs(newTabs);
    if (activeTabId === id) {
      setActiveTabId(newTabs[0].id);
      setInputUrl(newTabs[0].url);
    }
  };

  const navigate = (url: string) => {
    const newTabs = tabs.map(tab => {
      if (tab.id === activeTabId) {
        const newHistory = [...tab.history.slice(0, tab.historyIndex + 1), url];
        return {
          ...tab,
          url,
          title: getPageTitle(url),
          history: newHistory,
          historyIndex: newHistory.length - 1
        };
      }
      return tab;
    });
    setTabs(newTabs);
  };

  const goBack = () => {
    if (activeTab.historyIndex > 0) {
      const newIndex = activeTab.historyIndex - 1;
      const newUrl = activeTab.history[newIndex];
      const newTabs = tabs.map(tab => {
        if (tab.id === activeTabId) {
          return { ...tab, url: newUrl, historyIndex: newIndex, title: getPageTitle(newUrl) };
        }
        return tab;
      });
      setTabs(newTabs);
      setInputUrl(newUrl);
    }
  };

  const goForward = () => {
    if (activeTab.historyIndex < activeTab.history.length - 1) {
      const newIndex = activeTab.historyIndex + 1;
      const newUrl = activeTab.history[newIndex];
      const newTabs = tabs.map(tab => {
        if (tab.id === activeTabId) {
          return { ...tab, url: newUrl, historyIndex: newIndex, title: getPageTitle(newUrl) };
        }
        return tab;
      });
      setTabs(newTabs);
      setInputUrl(newUrl);
    }
  };

  const reload = () => {
    // Simulate reload
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(inputUrl);
  };

  const getPageTitle = (url: string): string => {
    if (url.includes('kali.local')) return 'Kali Web VM';
    if (url.includes('docs.local')) return 'Command Reference';
    if (url.includes('terminal.local')) return 'Terminal Shortcuts';
    if (url.includes('security-lab.local')) return 'Security Lab Guide';
    if (url.includes('search?')) return 'Search Results';
    return 'New Tab';
  };

  const renderPage = (url: string) => {
    if (url.includes('search?')) {
      const query = url.split('q=')[1] || '';
      return <SearchResults query={decodeURIComponent(query)} />;
    }

    switch (url) {
      case 'kali.local':
        return <KaliHome />;
      case 'docs.local':
        return <DocsPage />;
      case 'terminal.local':
        return <TerminalPage />;
      case 'security-lab.local':
        return <SecurityLabPage />;
      default:
        return <KaliHome />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* Tabs */}
      <div className="flex items-center bg-gray-800 border-b border-gray-700">
        {tabs.map(tab => (
          <div
            key={tab.id}
            className={`flex items-center px-4 py-2 border-r border-gray-700 cursor-pointer min-w-[150px] max-w-[200px] ${
              tab.id === activeTabId ? 'bg-gray-900' : 'bg-gray-800 hover:bg-gray-750'
            }`}
            onClick={() => {
              setActiveTabId(tab.id);
              setInputUrl(tab.url);
            }}
          >
            <span className="flex-1 truncate text-sm">{tab.title}</span>
            <button
              className="ml-2 text-gray-400 hover:text-white"
              onClick={(e) => {
                e.stopPropagation();
                closeTab(tab.id);
              }}
            >
              ×
            </button>
          </div>
        ))}
        <button
          className="px-3 py-2 text-gray-400 hover:text-white"
          onClick={addTab}
        >
          +
        </button>
      </div>

      {/* Address Bar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-800 border-b border-gray-700">
        <button
          onClick={goBack}
          disabled={activeTab.historyIndex === 0}
          className="px-2 py-1 text-sm disabled:text-gray-600 hover:text-blue-400"
        >
          ←
        </button>
        <button
          onClick={goForward}
          disabled={activeTab.historyIndex === activeTab.history.length - 1}
          className="px-2 py-1 text-sm disabled:text-gray-600 hover:text-blue-400"
        >
          →
        </button>
        <button
          onClick={reload}
          className="px-2 py-1 text-sm hover:text-blue-400"
        >
          ↻
        </button>
        <form onSubmit={handleSubmit} className="flex-1">
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            className="w-full px-3 py-1 bg-gray-900 border border-gray-700 rounded text-sm focus:outline-none focus:border-blue-500"
            placeholder="Enter URL or search..."
          />
        </form>
      </div>

      {/* Bookmarks Bar */}
      <div className="flex items-center gap-2 px-3 py-1 bg-gray-850 border-b border-gray-700 text-sm">
        <span className="text-gray-500">Bookmarks:</span>
        {['kali.local', 'docs.local', 'terminal.local', 'security-lab.local'].map(bookmark => (
          <button
            key={bookmark}
            onClick={() => {
              setInputUrl(bookmark);
              navigate(bookmark);
            }}
            className="px-2 py-0.5 hover:bg-gray-700 rounded text-blue-400"
          >
            {bookmark}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto bg-white text-gray-900">
        {renderPage(activeTab.url)}
      </div>
    </div>
  );
};

const KaliHome: React.FC = () => (
  <div className="max-w-4xl mx-auto p-8">
    <div className="text-center mb-12">
      <div className="inline-block p-4 bg-blue-600 rounded-full mb-4">
        <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 32 32">
          <path d="M16 2L3 8V16C3 23.5 8.5 30 16 32C23.5 30 29 23.5 29 16V8L16 2Z"/>
        </svg>
      </div>
      <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome to Kali Web VM</h1>
      <p className="text-xl text-gray-600">Browser-based Linux desktop simulation</p>
    </div>

    <div className="grid md:grid-cols-2 gap-6">
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-3 text-blue-900">🖥️ Interactive Terminal</h2>
        <p className="text-gray-700">Full Linux terminal with 50+ commands including file operations, networking tools, and system utilities.</p>
      </div>

      <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-3 text-green-900">📁 Virtual Filesystem</h2>
        <p className="text-gray-700">Complete filesystem with /home, /etc, /var and more. Create, edit, and manage files that persist in your browser.</p>
      </div>

      <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-3 text-purple-900">🛡️ Security Lab</h2>
        <p className="text-gray-700">Educational security tools including hash generators, encoders, port scanners, and HTTP analyzers.</p>
      </div>

      <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-3 text-orange-900">⚙️ Desktop Environment</h2>
        <p className="text-gray-700">Draggable windows, file manager, text editor, system monitor, and customizable settings.</p>
      </div>
    </div>

    <div className="mt-12 p-6 bg-gray-100 rounded-lg">
      <h3 className="text-xl font-bold mb-3">Quick Start</h3>
      <ul className="space-y-2 text-gray-700">
        <li><kbd className="px-2 py-1 bg-gray-200 rounded text-sm">Ctrl+Alt+T</kbd> - Open Terminal</li>
        <li><kbd className="px-2 py-1 bg-gray-200 rounded text-sm">Alt+Tab</kbd> - Switch Windows</li>
        <li>Type <code className="px-2 py-1 bg-gray-800 text-green-400 rounded text-sm">help</code> in the terminal for available commands</li>
        <li>Right-click the desktop for quick actions</li>
      </ul>
    </div>
  </div>
);

const DocsPage: React.FC = () => (
  <div className="max-w-4xl mx-auto p-8">
    <h1 className="text-3xl font-bold mb-6">Command Reference</h1>

    <section className="mb-8">
      <h2 className="text-2xl font-bold mb-4 text-blue-600">Filesystem Commands</h2>
      <div className="space-y-3">
        <CommandDoc cmd="ls [-la] [path]" desc="List directory contents. -l for long format, -a for hidden files" />
        <CommandDoc cmd="cd [path]" desc="Change directory. Use ~ for home, .. for parent, - for previous" />
        <CommandDoc cmd="pwd" desc="Print working directory" />
        <CommandDoc cmd="mkdir path" desc="Create directory" />
        <CommandDoc cmd="touch file" desc="Create empty file" />
        <CommandDoc cmd="cat file" desc="Display file contents" />
        <CommandDoc cmd="cp src dest" desc="Copy files" />
        <CommandDoc cmd="mv src dest" desc="Move/rename files" />
        <CommandDoc cmd="rm [-r] path" desc="Remove files. -r for recursive" />
      </div>
    </section>

    <section className="mb-8">
      <h2 className="text-2xl font-bold mb-4 text-green-600">System Information</h2>
      <div className="space-y-3">
        <CommandDoc cmd="whoami" desc="Display current user" />
        <CommandDoc cmd="hostname" desc="Display system hostname" />
        <CommandDoc cmd="uname [-a]" desc="Display system information" />
        <CommandDoc cmd="neofetch" desc="Display system info with ASCII art" />
        <CommandDoc cmd="date" desc="Display current date and time" />
      </div>
    </section>

    <section className="mb-8">
      <h2 className="text-2xl font-bold mb-4 text-purple-600">Network Commands (Simulated)</h2>
      <div className="space-y-3">
        <CommandDoc cmd="ifconfig" desc="Display network interface configuration" />
        <CommandDoc cmd="ping host" desc="Test network connectivity" />
        <CommandDoc cmd="curl url" desc="Transfer data from URL" />
      </div>
    </section>
  </div>
);

const TerminalPage: React.FC = () => (
  <div className="max-w-4xl mx-auto p-8">
    <h1 className="text-3xl font-bold mb-6">Terminal Shortcuts</h1>

    <div className="grid md:grid-cols-2 gap-6">
      <div className="bg-gray-100 p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-4">Navigation</h2>
        <ShortcutList shortcuts={[
          ['↑ / ↓', 'Navigate command history'],
          ['Ctrl+A', 'Move to line start'],
          ['Ctrl+E', 'Move to line end'],
          ['Tab', 'Auto-complete filename'],
        ]} />
      </div>

      <div className="bg-gray-100 p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-4">Control</h2>
        <ShortcutList shortcuts={[
          ['Ctrl+C', 'Cancel current command'],
          ['Ctrl+L', 'Clear terminal'],
          ['Ctrl+Shift+C', 'Copy selected text'],
          ['Ctrl+Shift+V', 'Paste text'],
        ]} />
      </div>

      <div className="bg-gray-100 p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-4">Shell Operators</h2>
        <ShortcutList shortcuts={[
          ['cmd1 && cmd2', 'Run cmd2 if cmd1 succeeds'],
          ['cmd1 ; cmd2', 'Run both commands'],
          ['cmd > file', 'Redirect output to file'],
          ['cmd | cmd2', 'Pipe output to another command'],
        ]} />
      </div>

      <div className="bg-gray-100 p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-4">Tips</h2>
        <ul className="space-y-2 text-sm text-gray-700">
          <li>• Use "history" to see all past commands</li>
          <li>• Use "!123" to re-run command #123</li>
          <li>• Press Tab to auto-complete file names</li>
          <li>• Use "clear" to clean the terminal</li>
        </ul>
      </div>
    </div>
  </div>
);

const SecurityLabPage: React.FC = () => (
  <div className="max-w-4xl mx-auto p-8">
    <h1 className="text-3xl font-bold mb-6">🛡️ Security Lab Guide</h1>

    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
      <p className="font-bold">Educational Purpose Only</p>
      <p className="text-sm">These tools are simulations for learning cybersecurity concepts. All operations are sandboxed and safe.</p>
    </div>

    <div className="space-y-6">
      <ToolDoc
        name="Hash Generator"
        desc="Generate cryptographic hashes (MD5, SHA-1, SHA-256, SHA-512) from any text input. Useful for verifying file integrity and understanding hash functions."
      />
      <ToolDoc
        name="Base64 Encoder/Decoder"
        desc="Encode and decode Base64 strings. Commonly used in data transmission and storage."
      />
      <ToolDoc
        name="URL Encoder/Decoder"
        desc="Encode special characters for URLs and decode URL-encoded strings."
      />
      <ToolDoc
        name="Port Scanner"
        desc="Simulated network port scanner showing common services (SSH, HTTP, HTTPS, FTP, MySQL). Scans against virtual targets only."
      />
      <ToolDoc
        name="HTTP Request Simulator"
        desc="Build and send simulated HTTP requests (GET, POST, PUT, DELETE) to understand web protocols and APIs."
      />
      <ToolDoc
        name="DNS Lookup"
        desc="Query simulated DNS records (A, AAAA, MX, TXT, CNAME) to learn about domain name resolution."
      />
    </div>
  </div>
);

const SearchResults: React.FC<{ query: string }> = ({ query }) => (
  <div className="max-w-4xl mx-auto p-8">
    <h1 className="text-2xl mb-6">Search results for: <span className="font-bold">{query}</span></h1>
    <div className="space-y-6">
      <div className="border-b pb-4">
        <h2 className="text-xl text-blue-600 mb-1">Kali Web VM Documentation</h2>
        <p className="text-sm text-green-700">kali.local</p>
        <p className="text-gray-700">Learn about the Kali Web VM features, including terminal commands, security lab tools, and desktop environment.</p>
      </div>
      <div className="border-b pb-4">
        <h2 className="text-xl text-blue-600 mb-1">Command Reference - {query}</h2>
        <p className="text-sm text-green-700">docs.local</p>
        <p className="text-gray-700">Complete reference for Linux commands available in the Kali Web VM terminal.</p>
      </div>
      <div className="border-b pb-4">
        <h2 className="text-xl text-blue-600 mb-1">Terminal Shortcuts and Tips</h2>
        <p className="text-sm text-green-700">terminal.local</p>
        <p className="text-gray-700">Master the terminal with keyboard shortcuts and efficiency tips.</p>
      </div>
    </div>
  </div>
);

const CommandDoc: React.FC<{ cmd: string; desc: string }> = ({ cmd, desc }) => (
  <div className="bg-gray-50 p-3 rounded">
    <code className="font-mono font-bold text-blue-600">{cmd}</code>
    <p className="text-sm text-gray-700 mt-1">{desc}</p>
  </div>
);

const ShortcutList: React.FC<{ shortcuts: [string, string][] }> = ({ shortcuts }) => (
  <div className="space-y-2">
    {shortcuts.map(([key, desc], i) => (
      <div key={i} className="flex items-center justify-between text-sm">
        <kbd className="px-2 py-1 bg-white border border-gray-300 rounded shadow-sm font-mono">{key}</kbd>
        <span className="text-gray-700 ml-3 flex-1">{desc}</span>
      </div>
    ))}
  </div>
);

const ToolDoc: React.FC<{ name: string; desc: string }> = ({ name, desc }) => (
  <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
    <h3 className="font-bold text-lg mb-2">{name}</h3>
    <p className="text-gray-700">{desc}</p>
  </div>
);

export default Browser;

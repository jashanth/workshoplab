import { useState } from 'react';
import { useStore } from '../../store';

interface Tool {
  id: string;
  name: string;
  description: string;
  command: string;
  requiresRoot?: boolean;
  installed?: boolean;
}

interface ToolCategory {
  id: string;
  name: string;
  icon: string;
  tools: Tool[];
}

export default function ToolsLauncher() {
  const [activeCategory, setActiveCategory] = useState<string>('info-gathering');
  const [searchQuery, setSearchQuery] = useState('');
  const { sessionState, openWindow, addNotification } = useStore();

  const categories: ToolCategory[] = [
    {
      id: 'info-gathering',
      name: 'Information Gathering',
      icon: '🔍',
      tools: [
        { id: 'nmap', name: 'Nmap', description: 'Network exploration and security auditing', command: 'nmap', installed: true },
        { id: 'dmitry', name: 'DMitry', description: 'Deepmagic Information Gathering Tool', command: 'dmitry' },
        { id: 'maltego', name: 'Maltego', description: 'Open source intelligence and forensics', command: 'maltego' },
        { id: 'netdiscover', name: 'Netdiscover', description: 'Active/passive ARP reconnaissance', command: 'netdiscover', requiresRoot: true },
        { id: 'recon-ng', name: 'Recon-ng', description: 'Web reconnaissance framework', command: 'recon-ng' },
        { id: 'spiderfoot', name: 'SpiderFoot', description: 'OSINT automation tool', command: 'spiderfoot' },
        { id: 'theharvester', name: 'theHarvester', description: 'E-mail, subdomain and name gathering', command: 'theharvester' },
      ],
    },
    {
      id: 'vulnerability',
      name: 'Vulnerability Analysis',
      icon: '🔎',
      tools: [
        { id: 'nikto', name: 'Nikto', description: 'Web server scanner', command: 'nikto', installed: true },
        { id: 'openvas', name: 'OpenVAS', description: 'Vulnerability scanning and management', command: 'openvas' },
        { id: 'sqlmap', name: 'sqlmap', description: 'Automatic SQL injection tool', command: 'sqlmap', installed: true },
        { id: 'wapiti', name: 'Wapiti', description: 'Web application vulnerability scanner', command: 'wapiti' },
        { id: 'wpscan', name: 'WPScan', description: 'WordPress security scanner', command: 'wpscan' },
      ],
    },
    {
      id: 'web-apps',
      name: 'Web Application Analysis',
      icon: '🌐',
      tools: [
        { id: 'burpsuite', name: 'Burp Suite', description: 'Web application security testing', command: 'burpsuite', installed: true },
        { id: 'dirb', name: 'dirb', description: 'Web content scanner', command: 'dirb' },
        { id: 'dirbuster', name: 'DirBuster', description: 'Multi-threaded directory/file brute forcer', command: 'dirbuster' },
        { id: 'gobuster', name: 'Gobuster', description: 'Directory/file & DNS busting tool', command: 'gobuster', installed: true },
        { id: 'ffuf', name: 'ffuf', description: 'Fast web fuzzer', command: 'ffuf', installed: true },
        { id: 'zaproxy', name: 'OWASP ZAP', description: 'Web app security scanner', command: 'zaproxy' },
      ],
    },
    {
      id: 'passwords',
      name: 'Password Attacks',
      icon: '🔐',
      tools: [
        { id: 'john', name: 'John the Ripper', description: 'Password cracker', command: 'john', installed: true },
        { id: 'hashcat', name: 'Hashcat', description: 'Advanced password recovery', command: 'hashcat', installed: true },
        { id: 'hydra', name: 'Hydra', description: 'Network logon cracker', command: 'hydra', installed: true },
        { id: 'medusa', name: 'Medusa', description: 'Parallel password cracker', command: 'medusa' },
        { id: 'ncrack', name: 'Ncrack', description: 'High-speed network authentication cracker', command: 'ncrack' },
        { id: 'ophcrack', name: 'Ophcrack', description: 'Windows password cracker', command: 'ophcrack' },
        { id: 'hashid', name: 'hashID', description: 'Hash identifier', command: 'hashid' },
      ],
    },
    {
      id: 'wireless',
      name: 'Wireless Attacks',
      icon: '📡',
      tools: [
        { id: 'aircrack-ng', name: 'Aircrack-ng', description: 'WiFi security auditing', command: 'aircrack-ng', installed: true, requiresRoot: true },
        { id: 'reaver', name: 'Reaver', description: 'WPS brute force attack tool', command: 'reaver', requiresRoot: true },
        { id: 'wifite', name: 'Wifite', description: 'Automated wireless attack tool', command: 'wifite', requiresRoot: true },
        { id: 'kismet', name: 'Kismet', description: 'Wireless network detector', command: 'kismet' },
        { id: 'fern', name: 'Fern Wifi Cracker', description: 'Wireless security auditing', command: 'fern-wifi-cracker' },
      ],
    },
    {
      id: 'exploitation',
      name: 'Exploitation Tools',
      icon: '💥',
      tools: [
        { id: 'metasploit', name: 'Metasploit Framework', description: 'Penetration testing platform', command: 'msfconsole', installed: true },
        { id: 'beef', name: 'BeEF', description: 'Browser exploitation framework', command: 'beef-xss' },
        { id: 'sqlmap', name: 'SQLMap', description: 'SQL injection automation', command: 'sqlmap', installed: true },
        { id: 'searchsploit', name: 'SearchSploit', description: 'Exploit database search', command: 'searchsploit', installed: true },
        { id: 'armitage', name: 'Armitage', description: 'Graphical cyber attack management', command: 'armitage' },
      ],
    },
    {
      id: 'sniffing',
      name: 'Sniffing & Spoofing',
      icon: '👁️',
      tools: [
        { id: 'wireshark', name: 'Wireshark', description: 'Network protocol analyzer', command: 'wireshark', installed: true },
        { id: 'tcpdump', name: 'tcpdump', description: 'Packet analyzer', command: 'tcpdump', requiresRoot: true, installed: true },
        { id: 'ettercap', name: 'Ettercap', description: 'Network sniffer/interceptor', command: 'ettercap', requiresRoot: true },
        { id: 'bettercap', name: 'Bettercap', description: 'Network attack and monitoring', command: 'bettercap', requiresRoot: true },
        { id: 'dsniff', name: 'dsniff', description: 'Network auditing toolset', command: 'dsniff', requiresRoot: true },
        { id: 'mitmproxy', name: 'mitmproxy', description: 'SSL/TLS-capable MITM proxy', command: 'mitmproxy' },
      ],
    },
    {
      id: 'post-exploitation',
      name: 'Post Exploitation',
      icon: '🎯',
      tools: [
        { id: 'mimikatz', name: 'Mimikatz', description: 'Windows credential extraction', command: 'mimikatz' },
        { id: 'powersploit', name: 'PowerSploit', description: 'PowerShell post-exploitation', command: 'powersploit' },
        { id: 'empire', name: 'Empire', description: 'Post-exploitation framework', command: 'empire' },
        { id: 'weevely', name: 'Weevely', description: 'Web shell tool', command: 'weevely' },
      ],
    },
    {
      id: 'forensics',
      name: 'Forensics',
      icon: '🔬',
      tools: [
        { id: 'autopsy', name: 'Autopsy', description: 'Digital forensics platform', command: 'autopsy' },
        { id: 'binwalk', name: 'Binwalk', description: 'Firmware analysis tool', command: 'binwalk', installed: true },
        { id: 'foremost', name: 'Foremost', description: 'File recovery based on headers', command: 'foremost' },
        { id: 'volatility', name: 'Volatility', description: 'Memory forensics framework', command: 'volatility' },
        { id: 'bulk-extractor', name: 'bulk_extractor', description: 'Extract features from disk images', command: 'bulk_extractor' },
      ],
    },
    {
      id: 'reverse',
      name: 'Reverse Engineering',
      icon: '⚙️',
      tools: [
        { id: 'radare2', name: 'radare2', description: 'Reverse engineering framework', command: 'radare2', installed: true },
        { id: 'ghidra', name: 'Ghidra', description: 'Software reverse engineering suite', command: 'ghidra' },
        { id: 'ida', name: 'IDA Free', description: 'Interactive disassembler', command: 'ida' },
        { id: 'gdb', name: 'GDB', description: 'GNU debugger', command: 'gdb', installed: true },
        { id: 'objdump', name: 'objdump', description: 'Display object file information', command: 'objdump', installed: true },
      ],
    },
    {
      id: 'reporting',
      name: 'Reporting Tools',
      icon: '📊',
      tools: [
        { id: 'dradis', name: 'Dradis', description: 'Collaboration and reporting', command: 'dradis' },
        { id: 'keepnote', name: 'KeepNote', description: 'Note-taking application', command: 'keepnote' },
        { id: 'cherrytree', name: 'CherryTree', description: 'Hierarchical note taking', command: 'cherrytree' },
        { id: 'cutycapt', name: 'CutyCapt', description: 'Web page screenshot utility', command: 'cutycapt' },
      ],
    },
  ];

  const activeTools = categories.find((c) => c.id === activeCategory)?.tools || [];
  const filteredTools = searchQuery
    ? activeTools.filter(
        (tool) =>
          tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tool.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : activeTools;

  const handleLaunchTool = (tool: Tool) => {
    const mode = sessionState?.mode || 'offline';

    if (mode === 'offline') {
      addNotification({
        title: 'Environment Not Connected',
        message: `${tool.name} requires a live Kali environment. Currently in offline mode.`,
        type: 'warning',
        icon: '⚠️',
      });
      return;
    }

    // Open terminal with the tool command
    openWindow({
      title: `Terminal - ${tool.name}`,
      icon: '💻',
      component: 'XTerminal',
      x: 120,
      y: 90,
      width: 900,
      height: 600,
      minWidth: 500,
      minHeight: 400,
      workspace: 1,
      props: { initialCommand: tool.command },
    });

    addNotification({
      title: `Launching ${tool.name}`,
      message: tool.description,
      type: 'info',
      icon: '🚀',
    });
  };

  const handleShowManPage = (tool: Tool) => {
    openWindow({
      title: `Manual - ${tool.name}`,
      icon: '📖',
      component: 'XTerminal',
      x: 140,
      y: 110,
      width: 900,
      height: 600,
      minWidth: 500,
      minHeight: 400,
      workspace: 1,
      props: { initialCommand: `man ${tool.command}` },
    });
  };

  return (
    <div className="flex h-full bg-gray-900 text-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <span>🛠️</span>
            <span>Kali Tools</span>
          </h2>
          <p className="text-xs text-gray-400 mt-1">Security & Penetration Testing</p>
        </div>

        <div className="p-3 border-b border-gray-700">
          <input
            type="text"
            placeholder="Search tools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-sm focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => {
                setActiveCategory(category.id);
                setSearchQuery('');
              }}
              className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-colors border-l-2 ${
                activeCategory === category.id
                  ? 'bg-gray-700 border-blue-500 text-white'
                  : 'border-transparent text-gray-400 hover:bg-gray-750 hover:text-gray-200'
              }`}
            >
              <span className="text-xl">{category.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{category.name}</div>
                <div className="text-xs text-gray-500">{category.tools.length} tools</div>
              </div>
            </button>
          ))}
        </div>

        {/* Connection Status */}
        <div className="p-3 border-t border-gray-700 bg-gray-850">
          <div className="flex items-center gap-2 text-xs">
            <div
              className={`w-2 h-2 rounded-full ${
                sessionState?.mode === 'online' ? 'bg-green-500' : 'bg-yellow-500'
              }`}
            />
            <span className="text-gray-400">
              {sessionState?.mode === 'online' ? 'Backend Online' : 'Offline Mode'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <div className="bg-gray-800 px-6 py-4 border-b border-gray-700">
          <h3 className="text-xl font-bold">
            {categories.find((c) => c.id === activeCategory)?.name || 'Tools'}
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            {searchQuery
              ? `${filteredTools.length} tools found`
              : `${filteredTools.length} available tools in this category`}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTools.map((tool) => (
              <div
                key={tool.id}
                className="bg-gray-800 rounded-lg border border-gray-700 hover:border-gray-600 transition-all p-4 flex flex-col"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-bold text-white flex items-center gap-2">
                    {tool.name}
                    {tool.installed && (
                      <span className="text-xs bg-green-600 text-white px-1.5 py-0.5 rounded">
                        Installed
                      </span>
                    )}
                  </h4>
                  {tool.requiresRoot && (
                    <span className="text-xs bg-red-600 text-white px-1.5 py-0.5 rounded" title="Requires root privileges">
                      root
                    </span>
                  )}
                </div>

                <p className="text-sm text-gray-400 mb-3 flex-1">{tool.description}</p>

                <div className="text-xs font-mono text-gray-500 mb-3 bg-gray-900 px-2 py-1 rounded">
                  $ {tool.command}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleLaunchTool(tool)}
                    className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors"
                  >
                    Launch
                  </button>
                  <button
                    onClick={() => handleShowManPage(tool)}
                    className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-sm transition-colors"
                    title="Manual page"
                  >
                    📖
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredTools.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-3">🔍</div>
              <p>No tools found matching &quot;{searchQuery}&quot;</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

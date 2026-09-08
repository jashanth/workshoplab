import React, { useState, useEffect } from 'react';
import { useStore } from '../../store';

const SystemMonitor: React.FC = () => {
  const { systemStats, processes, updateSystemStats } = useStore();
  const [activeTab, setActiveTab] = useState<'resources' | 'processes' | 'filesystems'>('resources');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'pid' | 'name' | 'cpu' | 'memory'>('cpu');
  const [sortDesc, setSortDesc] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      updateSystemStats();
    }, 2000);
    return () => clearInterval(interval);
  }, [updateSystemStats]);

  const filteredProcesses = processes
    .filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.pid.toString().includes(searchTerm))
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'pid':
          comparison = a.pid - b.pid;
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'cpu':
          comparison = a.cpu - b.cpu;
          break;
        case 'memory':
          comparison = a.memory - b.memory;
          break;
      }
      return sortDesc ? -comparison : comparison;
    });

  const ProgressBar: React.FC<{ value: number; color: string; label: string }> = ({ value, color, label }) => (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-gray-300">{label}</span>
        <span className="font-mono text-gray-100">{value.toFixed(1)}%</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-6 overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-500 flex items-center justify-end pr-2 text-xs font-bold text-white`}
          style={{ width: `${value}%` }}
        >
          {value > 15 && `${value.toFixed(0)}%`}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-gray-900 text-gray-100">
      {/* Tabs */}
      <div className="flex border-b border-gray-700 bg-gray-800">
        {[
          { id: 'resources', label: 'Resources' },
          { id: 'processes', label: 'Processes' },
          { id: 'filesystems', label: 'File Systems' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-gray-900 text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-750'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'resources' && (
          <div className="space-y-6 max-w-3xl mx-auto">
            <div className="bg-gray-800 p-6 rounded-lg space-y-6">
              <ProgressBar value={systemStats.cpu} color="bg-blue-500" label="CPU Usage" />
              <ProgressBar value={systemStats.memory} color="bg-green-500" label="Memory Usage" />
              <ProgressBar value={systemStats.disk} color="bg-yellow-500" label="Disk Usage" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="text-gray-400 text-sm mb-2">Network Upload</div>
                <div className="text-2xl font-bold text-green-400">{systemStats.network.up.toFixed(1)} KB/s</div>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="text-gray-400 text-sm mb-2">Network Download</div>
                <div className="text-2xl font-bold text-blue-400">{systemStats.network.down.toFixed(1)} KB/s</div>
              </div>
            </div>

            <div className="bg-gray-800 p-4 rounded-lg">
              <div className="text-gray-400 text-sm mb-2">System Uptime</div>
              <div className="text-xl font-mono">
                {Math.floor(systemStats.uptime / 86400)}d {Math.floor((systemStats.uptime % 86400) / 3600)}h{' '}
                {Math.floor((systemStats.uptime % 3600) / 60)}m
              </div>
            </div>
          </div>
        )}

        {activeTab === 'processes' && (
          <div className="space-y-4">
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Search processes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:border-blue-500"
              />
              <button className="px-4 py-2 bg-gray-800 border border-gray-700 rounded hover:bg-gray-750">
                Refresh
              </button>
            </div>

            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-750 text-left text-sm text-gray-400">
                  <tr>
                    <th
                      className="px-4 py-3 cursor-pointer hover:text-gray-200"
                      onClick={() => {
                        if (sortBy === 'pid') setSortDesc(!sortDesc);
                        else setSortBy('pid');
                      }}
                    >
                      PID {sortBy === 'pid' && (sortDesc ? '↓' : '↑')}
                    </th>
                    <th
                      className="px-4 py-3 cursor-pointer hover:text-gray-200"
                      onClick={() => {
                        if (sortBy === 'name') setSortDesc(!sortDesc);
                        else setSortBy('name');
                      }}
                    >
                      Name {sortBy === 'name' && (sortDesc ? '↓' : '↑')}
                    </th>
                    <th className="px-4 py-3">User</th>
                    <th
                      className="px-4 py-3 cursor-pointer hover:text-gray-200"
                      onClick={() => {
                        if (sortBy === 'cpu') setSortDesc(!sortDesc);
                        else setSortBy('cpu');
                      }}
                    >
                      CPU% {sortBy === 'cpu' && (sortDesc ? '↓' : '↑')}
                    </th>
                    <th
                      className="px-4 py-3 cursor-pointer hover:text-gray-200"
                      onClick={() => {
                        if (sortBy === 'memory') setSortDesc(!sortDesc);
                        else setSortBy('memory');
                      }}
                    >
                      Memory% {sortBy === 'memory' && (sortDesc ? '↓' : '↑')}
                    </th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {filteredProcesses.map((proc) => (
                    <tr key={proc.pid} className="border-t border-gray-700 hover:bg-gray-750">
                      <td className="px-4 py-3 font-mono">{proc.pid}</td>
                      <td className="px-4 py-3">{proc.name}</td>
                      <td className="px-4 py-3 text-gray-400">{proc.user}</td>
                      <td className="px-4 py-3 font-mono">{proc.cpu.toFixed(1)}</td>
                      <td className="px-4 py-3 font-mono">{proc.memory.toFixed(1)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            proc.status === 'running'
                              ? 'bg-green-900 text-green-300'
                              : 'bg-gray-700 text-gray-300'
                          }`}
                        >
                          {proc.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'filesystems' && (
          <div className="space-y-4">
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-750 text-left text-sm text-gray-400">
                  <tr>
                    <th className="px-4 py-3">Device</th>
                    <th className="px-4 py-3">Mount Point</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3">Used</th>
                    <th className="px-4 py-3">Free</th>
                    <th className="px-4 py-3">Usage</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {[
                    { device: '/dev/sda1', mount: '/', type: 'ext4', total: '60 GB', used: '19 GB', free: '38 GB', usage: 33 },
                    { device: 'tmpfs', mount: '/dev', type: 'tmpfs', total: '2 GB', used: '0 B', free: '2 GB', usage: 0 },
                    { device: 'tmpfs', mount: '/run', type: 'tmpfs', total: '400 MB', used: '1.4 MB', free: '399 MB', usage: 1 },
                    { device: 'tmpfs', mount: '/dev/shm', type: 'tmpfs', total: '2 GB', used: '0 B', free: '2 GB', usage: 0 },
                  ].map((fs, idx) => (
                    <tr key={idx} className="border-t border-gray-700 hover:bg-gray-750">
                      <td className="px-4 py-3 font-mono">{fs.device}</td>
                      <td className="px-4 py-3 font-mono">{fs.mount}</td>
                      <td className="px-4 py-3 text-gray-400">{fs.type}</td>
                      <td className="px-4 py-3">{fs.total}</td>
                      <td className="px-4 py-3">{fs.used}</td>
                      <td className="px-4 py-3">{fs.free}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-700 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full ${fs.usage > 80 ? 'bg-red-500' : fs.usage > 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
                              style={{ width: `${fs.usage}%` }}
                            />
                          </div>
                          <span className="text-xs font-mono w-10">{fs.usage}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemMonitor;

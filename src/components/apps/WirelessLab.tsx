import { useState } from 'react';

interface WirelessInterface {
  name: string;
  mode: 'managed' | 'monitor' | 'unavailable';
  mac: string;
  driver: string;
}

export default function WirelessLab() {
  const [interfaces] = useState<WirelessInterface[]>([]);
  const [commandOutput, setCommandOutput] = useState<string[]>([
    'Wireless Lab - Educational Environment',
    '',
    'This is a simulated wireless security lab for educational purposes.',
    'Real wireless adapters require actual hardware and proper permissions.',
    '',
  ]);

  const runCommand = (cmd: string) => {
    const output = [...commandOutput];
    output.push(`$ ${cmd}`);

    // Simulate command responses
    if (cmd.includes('iwconfig') || cmd.includes('iw dev')) {
      if (interfaces.length === 0) {
        output.push('No wireless interfaces detected.');
        output.push('');
        output.push('To use wireless tools in this VM:');
        output.push('1. Pass through a USB wireless adapter to the container');
        output.push('2. Or use a VM with native wireless hardware support');
      } else {
        interfaces.forEach(iface => {
          output.push(`${iface.name}    IEEE 802.11  Mode:${iface.mode}`);
          output.push(`          MAC: ${iface.mac}  Driver: ${iface.driver}`);
        });
      }
    } else if (cmd.includes('airmon-ng')) {
      output.push('');
      output.push('Airmon-ng - Wireless Monitor Mode Management');
      output.push('');
      if (interfaces.length === 0) {
        output.push('No wireless interfaces available.');
        output.push('');
        output.push('This tool requires a physical or virtual wireless adapter.');
      } else {
        output.push('PHY     Interface   Driver      Chipset');
        interfaces.forEach((iface, idx) => {
          output.push(`phy${idx}    ${iface.name}        ${iface.driver}      Simulated Adapter`);
        });
      }
    } else if (cmd.includes('ip link') || cmd.includes('ip addr')) {
      output.push('1: lo: <LOOPBACK,UP,LOWER_UP>');
      output.push('    link/loopback 00:00:00:00:00:00');
      output.push('2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP>');
      output.push('    link/ether 08:00:27:8e:d4:41');
      if (interfaces.length > 0) {
        interfaces.forEach((iface, idx) => {
          output.push(`${idx + 3}: ${iface.name}: <BROADCAST,MULTICAST>`);
          output.push(`    link/ether ${iface.mac}`);
        });
      }
    } else {
      output.push('Command not recognized in this simulation.');
      output.push('Supported commands: iwconfig, iw dev, airmon-ng, ip link, ip addr');
    }

    output.push('');
    setCommandOutput(output);
  };

  const commandExamples = [
    { cmd: 'iwconfig', desc: 'Show wireless interfaces' },
    { cmd: 'iw dev', desc: 'List wireless devices' },
    { cmd: 'ip link', desc: 'Show network interfaces' },
    { cmd: 'airmon-ng', desc: 'List wireless interfaces for monitor mode' },
  ];

  return (
    <div className="flex h-full bg-gray-900 text-gray-100">
      {/* Sidebar */}
      <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <span>📡</span>
            <span>Wireless Lab</span>
          </h2>
          <p className="text-xs text-gray-400 mt-1">Educational Wireless Security Tools</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-blue-400 mb-2">Interface Status</h3>
            {interfaces.length === 0 ? (
              <div className="bg-yellow-900/20 border border-yellow-700/50 rounded p-3 text-xs">
                <div className="flex items-start gap-2">
                  <span className="text-yellow-500">⚠️</span>
                  <div>
                    <div className="font-semibold text-yellow-400">No Wireless Adapter</div>
                    <div className="text-gray-400 mt-1">
                      This VM does not have a wireless adapter available.
                      Commands below show educational examples.
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {interfaces.map(iface => (
                  <div key={iface.name} className="bg-gray-700/50 rounded p-2 text-xs">
                    <div className="font-semibold">{iface.name}</div>
                    <div className="text-gray-400">Mode: {iface.mode}</div>
                    <div className="text-gray-400">MAC: {iface.mac}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-sm font-semibold text-blue-400 mb-2">Quick Commands</h3>
            <div className="space-y-2">
              {commandExamples.map((ex, idx) => (
                <button
                  key={idx}
                  onClick={() => runCommand(ex.cmd)}
                  className="w-full text-left bg-gray-700/50 hover:bg-gray-700 rounded p-2 text-xs transition-colors"
                >
                  <div className="font-mono text-green-400">{ex.cmd}</div>
                  <div className="text-gray-400 mt-1">{ex.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-900/20 border border-blue-700/50 rounded text-xs">
            <div className="font-semibold text-blue-400 mb-1">⚡ Educational Note</div>
            <div className="text-gray-300">
              This lab simulates wireless security tools for learning.
              Real wireless testing requires:
              <ul className="mt-1 ml-4 list-disc text-gray-400">
                <li>Physical wireless adapter</li>
                <li>Monitor mode capability</li>
                <li>Proper authorization</li>
                <li>Isolated lab environment</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Main Output Area */}
      <div className="flex-1 flex flex-col">
        <div className="bg-gray-800 px-6 py-4 border-b border-gray-700">
          <h3 className="text-xl font-bold">Command Output</h3>
          <p className="text-sm text-gray-400 mt-1">
            Wireless interface detection and management
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-black font-mono text-sm">
          {commandOutput.map((line, idx) => (
            <div
              key={idx}
              className={`${
                line.startsWith('$')
                  ? 'text-green-400 font-semibold mt-2'
                  : line.includes('No wireless') || line.includes('unavailable')
                  ? 'text-yellow-400'
                  : line.includes('PHY') || line.includes('Interface')
                  ? 'text-cyan-400'
                  : 'text-gray-300'
              }`}
            >
              {line || ' '}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

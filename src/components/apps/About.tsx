import React from 'react';

const About: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-gray-900 text-gray-100 p-8 text-center">
      <div className="text-6xl mb-4">🐉</div>
      <h1 className="text-2xl font-bold mb-2">Kali Web VM</h1>
      <p className="text-gray-400 mb-6">Version 1.0.0 (Educational Simulation)</p>

      <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full text-left space-y-3 mb-6">
        <div className="flex justify-between border-b border-gray-700 pb-2">
          <span className="text-gray-400">Environment:</span>
          <span className="font-mono">In-Browser VM</span>
        </div>
        <div className="flex justify-between border-b border-gray-700 pb-2">
          <span className="text-gray-400">Kernel:</span>
          <span className="font-mono">Linux 6.5.0-kali3</span>
        </div>
        <div className="flex justify-between border-b border-gray-700 pb-2">
          <span className="text-gray-400">Desktop:</span>
          <span className="font-mono">Xfce 4.18 (simulated)</span>
        </div>
        <div className="flex justify-between border-b border-gray-700 pb-2">
          <span className="text-gray-400">Storage:</span>
          <span className="font-mono">Virtual Filesystem (Persistent)</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Architecture:</span>
          <span className="font-mono">x86_64</span>
        </div>
      </div>

      <p className="text-xs text-gray-500 max-w-sm">
        This is a browser-based simulation designed for educational purposes. All commands and security tools operate in a simulated environment.
      </p>
    </div>
  );
};

export default About;

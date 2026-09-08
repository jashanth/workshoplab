import React, { useState } from 'react';

const SecurityLab: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'hash' | 'base64' | 'url' | 'port' | 'http' | 'dns'>('hash');
  const [hashInput, setHashInput] = useState('');
  const [hashResults, setHashResults] = useState<Record<string, string>>({});
  const [base64Input, setBase64Input] = useState('');
  const [base64Output, setBase64Output] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [urlOutput, setUrlOutput] = useState('');
  const [portTarget, setPortTarget] = useState('lab.local');
  const [portResults, setPortResults] = useState<string[]>([]);
  const [httpUrl, setHttpUrl] = useState('https://api.example.com/users');
  const [httpMethod, setHttpMethod] = useState('GET');
  const [httpResponse, setHttpResponse] = useState('');
  const [dnsQuery, setDnsQuery] = useState('example.com');
  const [dnsType, setDnsType] = useState('A');
  const [dnsResults, setDnsResults] = useState<string[]>([]);

  const generateHash = async () => {
    const encoder = new TextEncoder();
    const data = encoder.encode(hashInput);

    const sha256 = await crypto.subtle.digest('SHA-256', data);
    const sha256Hex = Array.from(new Uint8Array(sha256))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const sha512 = await crypto.subtle.digest('SHA-512', data);
    const sha512Hex = Array.from(new Uint8Array(sha512))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Simple MD5-like hash simulation (not real MD5)
    let md5 = 0;
    for (let i = 0; i < hashInput.length; i++) {
      md5 = ((md5 << 5) - md5) + hashInput.charCodeAt(i);
      md5 = md5 & md5;
    }
    const md5Hex = Math.abs(md5).toString(16).padStart(32, '0').slice(0, 32);

    setHashResults({
      MD5: md5Hex,
      'SHA-1': 'simulated-' + sha256Hex.slice(0, 40),
      'SHA-256': sha256Hex,
      'SHA-512': sha512Hex,
    });
  };

  const encodeBase64 = () => {
    try {
      const encoded = btoa(base64Input);
      setBase64Output(encoded);
    } catch {
      setBase64Output('Error: Invalid input');
    }
  };

  const decodeBase64 = () => {
    try {
      const decoded = atob(base64Input);
      setBase64Output(decoded);
    } catch {
      setBase64Output('Error: Invalid Base64 string');
    }
  };

  const encodeUrl = () => {
    setUrlOutput(encodeURIComponent(urlInput));
  };

  const decodeUrl = () => {
    try {
      setUrlOutput(decodeURIComponent(urlInput));
    } catch {
      setUrlOutput('Error: Invalid URL encoding');
    }
  };

  const scanPorts = () => {
    setPortResults(['Scanning...']);
    setTimeout(() => {
      const commonPorts = [
        { port: 21, service: 'ftp', open: false },
        { port: 22, service: 'ssh', open: true },
        { port: 23, service: 'telnet', open: false },
        { port: 25, service: 'smtp', open: false },
        { port: 53, service: 'dns', open: true },
        { port: 80, service: 'http', open: true },
        { port: 443, service: 'https', open: true },
        { port: 3306, service: 'mysql', open: false },
        { port: 5432, service: 'postgresql', open: false },
        { port: 8080, service: 'http-alt', open: false },
      ];

      const results = [
        `Starting port scan on ${portTarget}...`,
        '',
        'PORT     STATE    SERVICE',
        ...commonPorts.map(p => `${p.port.toString().padEnd(9)}${p.open ? 'OPEN' : 'CLOSED'}   ${p.service}`),
        '',
        `Scan complete: ${commonPorts.filter(p => p.open).length} open ports found.`
      ];
      setPortResults(results);
    }, 2000);
  };

  const simulateHttp = () => {
    setHttpResponse('Loading...');
    setTimeout(() => {
      const response = JSON.stringify({
        status: 200,
        statusText: 'OK',
        headers: {
          'Content-Type': 'application/json',
          'Server': 'nginx/1.18.0',
          'Date': new Date().toUTCString(),
        },
        body: {
          success: true,
          data: [
            { id: 1, name: 'Alice', email: 'alice@example.com' },
            { id: 2, name: 'Bob', email: 'bob@example.com' },
          ],
          timestamp: Date.now(),
        }
      }, null, 2);
      setHttpResponse(response);
    }, 1000);
  };

  const lookupDns = () => {
    setDnsResults(['Querying...']);
    setTimeout(() => {
      const records: Record<string, string[]> = {
        A: [
          `${dnsQuery}.  3600  IN  A  93.184.216.34`,
          `${dnsQuery}.  3600  IN  A  93.184.216.35`,
        ],
        AAAA: [
          `${dnsQuery}.  3600  IN  AAAA  2606:2800:220:1:248:1893:25c8:1946`,
        ],
        MX: [
          `${dnsQuery}.  3600  IN  MX  10 mail.${dnsQuery}.`,
          `${dnsQuery}.  3600  IN  MX  20 mail2.${dnsQuery}.`,
        ],
        TXT: [
          `${dnsQuery}.  3600  IN  TXT  "v=spf1 include:_spf.${dnsQuery} ~all"`,
        ],
        NS: [
          `${dnsQuery}.  3600  IN  NS  ns1.${dnsQuery}.`,
          `${dnsQuery}.  3600  IN  NS  ns2.${dnsQuery}.`,
        ],
      };
      setDnsResults(records[dnsType] || ['No records found']);
    }, 800);
  };

  const tabs = [
    { id: 'hash', label: 'Hash Generator' },
    { id: 'base64', label: 'Base64' },
    { id: 'url', label: 'URL Encode' },
    { id: 'port', label: 'Port Scanner' },
    { id: 'http', label: 'HTTP Request' },
    { id: 'dns', label: 'DNS Lookup' },
  ];

  return (
    <div className="flex flex-col h-full bg-gray-900 text-gray-100">
      {/* Header */}
      <div className="bg-gray-800 px-6 py-4 border-b border-gray-700">
        <h2 className="text-xl font-bold flex items-center gap-2">
          🛡️ Security Lab
          <span className="text-sm font-normal text-gray-400">(Educational Tools)</span>
        </h2>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700 bg-gray-800 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-4 py-3 font-medium whitespace-nowrap transition-colors ${
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
        {activeTab === 'hash' && (
          <div className="max-w-2xl mx-auto space-y-4">
            <textarea
              value={hashInput}
              onChange={(e) => setHashInput(e.target.value)}
              placeholder="Enter text to hash..."
              className="w-full h-32 px-4 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:border-blue-500 font-mono text-sm"
            />
            <button
              onClick={generateHash}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium transition-colors"
            >
              Generate Hashes
            </button>
            {Object.keys(hashResults).length > 0 && (
              <div className="space-y-3">
                {Object.entries(hashResults).map(([algo, hash]) => (
                  <div key={algo} className="bg-gray-800 p-4 rounded">
                    <div className="text-sm text-gray-400 mb-2">{algo}</div>
                    <div className="font-mono text-xs break-all text-green-400">{hash}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'base64' && (
          <div className="max-w-2xl mx-auto space-y-4">
            <textarea
              value={base64Input}
              onChange={(e) => setBase64Input(e.target.value)}
              placeholder="Enter text or Base64 string..."
              className="w-full h-32 px-4 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:border-blue-500 font-mono text-sm"
            />
            <div className="flex gap-3">
              <button
                onClick={encodeBase64}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium transition-colors"
              >
                Encode
              </button>
              <button
                onClick={decodeBase64}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded font-medium transition-colors"
              >
                Decode
              </button>
            </div>
            {base64Output && (
              <div className="bg-gray-800 p-4 rounded">
                <div className="text-sm text-gray-400 mb-2">Result</div>
                <div className="font-mono text-sm break-all">{base64Output}</div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'url' && (
          <div className="max-w-2xl mx-auto space-y-4">
            <input
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Enter URL or text..."
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:border-blue-500"
            />
            <div className="flex gap-3">
              <button
                onClick={encodeUrl}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium transition-colors"
              >
                Encode
              </button>
              <button
                onClick={decodeUrl}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded font-medium transition-colors"
              >
                Decode
              </button>
            </div>
            {urlOutput && (
              <div className="bg-gray-800 p-4 rounded">
                <div className="text-sm text-gray-400 mb-2">Result</div>
                <div className="font-mono text-sm break-all">{urlOutput}</div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'port' && (
          <div className="max-w-2xl mx-auto space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Target Host</label>
              <select
                value={portTarget}
                onChange={(e) => setPortTarget(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:border-blue-500"
              >
                <option value="lab.local">lab.local (Simulated)</option>
                <option value="192.168.1.1">192.168.1.1 (Simulated)</option>
                <option value="gateway.local">gateway.local (Simulated)</option>
              </select>
            </div>
            <button
              onClick={scanPorts}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium transition-colors"
            >
              Start Scan
            </button>
            {portResults.length > 0 && (
              <div className="bg-gray-800 p-4 rounded font-mono text-sm">
                {portResults.map((line, i) => (
                  <div key={i} className={line.includes('OPEN') ? 'text-green-400' : ''}>{line}</div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'http' && (
          <div className="max-w-2xl mx-auto space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Method</label>
              <select
                value={httpMethod}
                onChange={(e) => setHttpMethod(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:border-blue-500"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">URL</label>
              <input
                value={httpUrl}
                onChange={(e) => setHttpUrl(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:border-blue-500"
              />
            </div>
            <button
              onClick={simulateHttp}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium transition-colors"
            >
              Send Request
            </button>
            {httpResponse && (
              <div className="bg-gray-800 p-4 rounded">
                <div className="text-sm text-gray-400 mb-2">Response</div>
                <pre className="font-mono text-xs overflow-auto">{httpResponse}</pre>
              </div>
            )}
          </div>
        )}

        {activeTab === 'dns' && (
          <div className="max-w-2xl mx-auto space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Domain</label>
              <input
                value={dnsQuery}
                onChange={(e) => setDnsQuery(e.target.value)}
                placeholder="example.com"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Record Type</label>
              <select
                value={dnsType}
                onChange={(e) => setDnsType(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:border-blue-500"
              >
                <option value="A">A (IPv4 Address)</option>
                <option value="AAAA">AAAA (IPv6 Address)</option>
                <option value="MX">MX (Mail Exchange)</option>
                <option value="TXT">TXT (Text Record)</option>
                <option value="NS">NS (Name Server)</option>
              </select>
            </div>
            <button
              onClick={lookupDns}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium transition-colors"
            >
              Lookup
            </button>
            {dnsResults.length > 0 && (
              <div className="bg-gray-800 p-4 rounded font-mono text-sm">
                {dnsResults.map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SecurityLab;

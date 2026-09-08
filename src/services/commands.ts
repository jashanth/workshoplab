import { VirtualFileSystem } from './filesystem';
import type { FSNode } from '../types';

export class CommandInterpreter {
  private fs: VirtualFileSystem;
  private env: Map<string, string>;
  private history: string[];

  constructor(
    fs: VirtualFileSystem,
    env?: Map<string, string>
  ) {
    this.fs = fs;
    this.history = [];
    this.env = env || new Map([
      ['USER', 'kali'],
      ['HOSTNAME', 'kali'],
      ['HOME', '/home/kali'],
      ['PATH', '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin'],
      ['SHELL', '/bin/bash'],
      ['TERM', 'xterm-256color'],
      ['LANG', 'en_US.UTF-8'],
      ['PWD', '/home/kali'],
      ['EDITOR', 'nano'],
    ]);
  }

  public getHistory(): string[] {
    return [...this.history];
  }

  public getCwd(): string {
    return this.fs.cwd;
  }

  public execute(input: string): string[] {
    const trimmed = input.trim();
    if (!trimmed) return [];

    this.history.push(trimmed);

    // Handle compound commands (&&, ||, ;)
    if (trimmed.includes('&&')) {
      const parts = trimmed.split('&&');
      const output: string[] = [];
      for (const part of parts) {
        const res = this.executeSingle(part.trim());
        output.push(...res);
      }
      return output;
    }

    if (trimmed.includes(';')) {
      const parts = trimmed.split(';');
      const output: string[] = [];
      for (const part of parts) {
        if (part.trim()) {
          const res = this.executeSingle(part.trim());
          output.push(...res);
        }
      }
      return output;
    }

    // Handle pipes
    if (trimmed.includes('|')) {
      return this.handlePipe(trimmed);
    }

    // Handle output redirection (> and >>)
    if (trimmed.includes('>>') || trimmed.includes('>')) {
      return this.handleRedirection(trimmed);
    }

    return this.executeSingle(trimmed);
  }

  private handlePipe(commandStr: string): string[] {
    const pipeParts = commandStr.split('|').map(s => s.trim());
    let currentOutput: string[] = [];

    for (let i = 0; i < pipeParts.length; i++) {
      const part = pipeParts[i];
      if (i === 0) {
        currentOutput = this.executeSingle(part);
      } else {
        const tokens = this.tokenize(part);
        const cmd = tokens[0];
        const args = tokens.slice(1);

        if (cmd === 'grep') {
          const pattern = args[0] || '';
          const ignoreCase = args.includes('-i');
          const reg = new RegExp(pattern.replace(/^-i$/, ''), ignoreCase ? 'i' : '');
          currentOutput = currentOutput.filter(line => reg.test(line));
        } else if (cmd === 'head') {
          const n = args.includes('-n') ? parseInt(args[args.indexOf('-n') + 1], 10) || 10 : 10;
          currentOutput = currentOutput.slice(0, n);
        } else if (cmd === 'tail') {
          const n = args.includes('-n') ? parseInt(args[args.indexOf('-n') + 1], 10) || 10 : 10;
          currentOutput = currentOutput.slice(-n);
        } else if (cmd === 'wc') {
          const lines = currentOutput.length;
          const words = currentOutput.join(' ').split(/\s+/).filter(Boolean).length;
          const chars = currentOutput.join('\n').length;
          currentOutput = [`  ${lines}  ${words}  ${chars}`];
        } else if (cmd === 'sort') {
          currentOutput = [...currentOutput].sort();
        } else if (cmd === 'uniq') {
          currentOutput = currentOutput.filter((item, pos, ary) => !pos || item !== ary[pos - 1]);
        }
      }
    }
    return currentOutput;
  }

  private handleRedirection(commandStr: string): string[] {
    const isAppend = commandStr.includes('>>');
    const parts = isAppend ? commandStr.split('>>') : commandStr.split('>');
    const cmdPart = parts[0].trim();
    const filePath = parts[1].trim();

    const output = this.executeSingle(cmdPart);
    const content = output.join('\n');

    try {
      if (isAppend) {
        try {
          const existing = this.fs.readFile(filePath);
          this.fs.writeFile(filePath, existing + '\n' + content);
        } catch {
          this.fs.writeFile(filePath, content);
        }
      } else {
        this.fs.writeFile(filePath, content);
      }
      return [];
    } catch (err: unknown) {
      return [`bash: ${filePath}: ${(err as Error).message}`];
    }
  }

  private tokenize(str: string): string[] {
    const tokens: string[] = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';

    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      if ((char === '"' || char === "'") && !inQuotes) {
        inQuotes = true;
        quoteChar = char;
      } else if (char === quoteChar && inQuotes) {
        inQuotes = false;
        quoteChar = '';
      } else if (char === ' ' && !inQuotes) {
        if (current) {
          tokens.push(current);
          current = '';
        }
      } else {
        current += char;
      }
    }
    if (current) {
      tokens.push(current);
    }
    return tokens;
  }

  private executeSingle(cmdStr: string): string[] {
    const tokens = this.tokenize(cmdStr);
    if (tokens.length === 0) return [];

    let cmd = tokens[0];
    const args = tokens.slice(1);

    // Handle sudo wrapper
    if (cmd === 'sudo') {
      if (args.length === 0) {
        return ['usage: sudo command'];
      }
      cmd = args[0];
      args.shift();
    }

    switch (cmd) {
      case 'clear':
        return ['__CLEAR__'];

      case 'exit':
        return ['__EXIT__'];

      case 'pwd':
        return [this.fs.cwd];

      case 'whoami':
        return [this.env.get('USER') || 'kali'];

      case 'hostname':
        return [this.env.get('HOSTNAME') || 'kali'];

      case 'uname':
        if (args.includes('-a')) {
          return ['Linux kali 6.5.0-kali3-amd64 #1 SMP PREEMPT_DYNAMIC Kali 6.5.6-1kali1 (2023-10-09) x86_64 GNU/Linux'];
        }
        return ['Linux'];

      case 'date':
        return [new Date().toString()];

      case 'uptime':
        return [' 12:34:56 up 2 days,  4:12,  2 users,  load average: 0.15, 0.08, 0.01'];

      case 'id':
        return ['uid=1000(kali) gid=1000(kali) groups=1000(kali),4(adm),24(cdrom),27(sudo),30(dip),46(plugdev),117(kvm),128(docker)'];

      case 'echo': {
        const text = args.join(' ').replace(/^["']|["']$/g, '');
        // Replace env variables
        const expanded = text.replace(/\$([A-Za-z0-9_]+)/g, (_, name) => this.env.get(name) || '');
        return [expanded];
      }

      case 'cd': {
        const target = args[0] || '~';
        try {
          const newDir = this.fs.cd(target);
          this.env.set('PWD', newDir);
          return [];
        } catch (err: unknown) {
          return [`bash: cd: ${target}: ${(err as Error).message}`];
        }
      }

      case 'ls': {
        const showAll = args.includes('-a') || args.includes('-la') || args.includes('-al');
        const showLong = args.includes('-l') || args.includes('-la') || args.includes('-al');
        const pathArg = args.find(a => !a.startsWith('-')) || '.';

        try {
          if (showLong) {
            let nodes: FSNode[] = [];
            try {
              nodes = this.fs.lsDetailed(pathArg);
            } catch (err: unknown) {
              return [`ls: ${(err as Error).message}`];
            }

            if (!showAll) {
              nodes = nodes.filter(n => !n.name.startsWith('.'));
            }

            const lines: string[] = [`total ${nodes.length * 4}`];
            for (const node of nodes) {
              const perms = node.permissions;
              const owner = node.owner.padEnd(8);
              const group = node.group.padEnd(8);
              const size = node.size.toString().padStart(8);
              const dateStr = 'Sep 06 12:00';
              const name = node.type === 'directory' ? `${node.name}/` : node.name;
              lines.push(`${perms} 1 ${owner} ${group} ${size} ${dateStr} ${name}`);
            }
            return lines;
          } else {
            let names: string[] = [];
            try {
              names = this.fs.ls(pathArg);
            } catch (err: unknown) {
              return [`ls: ${(err as Error).message}`];
            }

            if (!showAll) {
              names = names.filter(n => !n.startsWith('.'));
            }

            return [names.join('  ')];
          }
        } catch (err: unknown) {
          return [`ls: ${(err as Error).message}`];
        }
      }

      case 'mkdir': {
        if (args.length === 0) return ['mkdir: missing operand'];
        const target = args.find(a => !a.startsWith('-')) || '';
        const recursive = args.includes('-p');
        try {
          this.fs.mkdir(target, recursive);
          return [];
        } catch (err: unknown) {
          return [`mkdir: cannot create directory '${target}': ${(err as Error).message}`];
        }
      }

      case 'touch': {
        if (args.length === 0) return ['touch: missing file operand'];
        for (const arg of args) {
          try {
            this.fs.touch(arg);
          } catch (err: unknown) {
            return [`touch: ${(err as Error).message}`];
          }
        }
        return [];
      }

      case 'cat': {
        if (args.length === 0) return ['cat: missing file operand'];
        const lines: string[] = [];
        for (const arg of args) {
          try {
            const content = this.fs.readFile(arg);
            lines.push(...content.split('\n'));
          } catch (err: unknown) {
            return [`cat: ${arg}: ${(err as Error).message}`];
          }
        }
        return lines;
      }

      case 'rm': {
        if (args.length === 0) return ['rm: missing operand'];
        const recursive = args.includes('-r') || args.includes('-rf') || args.includes('-fr');
        const target = args.find(a => !a.startsWith('-')) || '';
        try {
          this.fs.rm(target, recursive);
          return [];
        } catch (err: unknown) {
          return [`rm: cannot remove '${target}': ${(err as Error).message}`];
        }
      }

      case 'cp': {
        if (args.length < 2) return ['cp: missing file operand'];
        const src = args[0];
        const dest = args[1];
        try {
          this.fs.cp(src, dest);
          return [];
        } catch (err: unknown) {
          return [`cp: ${(err as Error).message}`];
        }
      }

      case 'mv': {
        if (args.length < 2) return ['mv: missing file operand'];
        const src = args[0];
        const dest = args[1];
        try {
          this.fs.mv(src, dest);
          return [];
        } catch (err: unknown) {
          return [`mv: ${(err as Error).message}`];
        }
      }

      case 'head': {
        const nArgIdx = args.indexOf('-n');
        const numLines = nArgIdx !== -1 ? parseInt(args[nArgIdx + 1], 10) || 10 : 10;
        const file = args.find((a, i) => !a.startsWith('-') && (nArgIdx === -1 || i !== nArgIdx + 1));
        if (!file) return ['head: missing file'];
        try {
          const content = this.fs.readFile(file);
          return content.split('\n').slice(0, numLines);
        } catch (err: unknown) {
          return [`head: ${file}: ${(err as Error).message}`];
        }
      }

      case 'tail': {
        const nArgIdx = args.indexOf('-n');
        const numLines = nArgIdx !== -1 ? parseInt(args[nArgIdx + 1], 10) || 10 : 10;
        const file = args.find((a, i) => !a.startsWith('-') && (nArgIdx === -1 || i !== nArgIdx + 1));
        if (!file) return ['tail: missing file'];
        try {
          const content = this.fs.readFile(file);
          return content.split('\n').slice(-numLines);
        } catch (err: unknown) {
          return [`tail: ${file}: ${(err as Error).message}`];
        }
      }

      case 'grep': {
        const pattern = args.find(a => !a.startsWith('-')) || '';
        const files = args.filter(a => !a.startsWith('-')).slice(1);
        if (!pattern || files.length === 0) return ['usage: grep [options] pattern file...'];
        const results: string[] = [];
        for (const file of files) {
          try {
            const content = this.fs.readFile(file);
            const lines = content.split('\n');
            for (const line of lines) {
              if (line.includes(pattern)) {
                results.push(line);
              }
            }
          } catch (err: unknown) {
            results.push(`grep: ${file}: ${(err as Error).message}`);
          }
        }
        return results;
      }

      case 'tree': {
        const target = args[0] || '.';
        try {
          const treeOutput = this.fs.tree(target);
          return treeOutput.split('\n');
        } catch (err: unknown) {
          return [`tree: ${target}: ${(err as Error).message}`];
        }
      }

      case 'find': {
        const target = args[0] || '.';
        const nameIdx = args.indexOf('-name');
        const nameFilter = nameIdx !== -1 ? args[nameIdx + 1] : '';
        try {
          return this.fs.find(target, nameFilter);
        } catch (err: unknown) {
          return [`find: ${target}: ${(err as Error).message}`];
        }
      }

      case 'env':
        return Array.from(this.env.entries()).map(([k, v]) => `${k}=${v}`);

      case 'export': {
        if (args.length === 0) return Array.from(this.env.entries()).map(([k, v]) => `declare -x ${k}="${v}"`);
        for (const arg of args) {
          const [key, val] = arg.split('=');
          if (key && val !== undefined) {
            this.env.set(key, val.replace(/^["']|["']$/g, ''));
          }
        }
        return [];
      }

      case 'which': {
        if (args.length === 0) return [];
        const targetCmd = args[0];
        const known = ['ls', 'cd', 'cat', 'pwd', 'mkdir', 'rm', 'cp', 'mv', 'python3', 'git', 'curl', 'ping', 'bash', 'grep', 'find'];
        if (known.includes(targetCmd)) {
          return [`/usr/bin/${targetCmd}`];
        }
        return [`which: no ${targetCmd} in (${this.env.get('PATH')})`];
      }

      case 'history':
        return this.history.map((h, i) => `  ${(i + 1).toString().padStart(4)}  ${h}`);

      case 'help':
        return [
          'Kali Web VM - Supported Simulated Commands:',
          '  Filesystem:  ls, cd, pwd, mkdir, touch, cat, cp, mv, rm, head, tail, grep, find, tree',
          '  System info: whoami, hostname, uname, date, uptime, id, env, export, which, neofetch',
          '  Network:     ifconfig, ip addr, ip link, ip route, iwconfig, iw dev, airmon-ng, ping, curl, wget',
          '  Processes:   ps, top, kill, free, df',
          '  Utilities:   echo, clear, history, help, man, python3, git, nano, vim',
          '  Shell ops:   >, >>, |, &&, ;'
        ];

      case 'man': {
        if (args.length === 0) return ['What manual page do you want?'];
        const manCmd = args[0];
        return [
          `${manCmd.toUpperCase()}(1)               General Commands Manual               ${manCmd.toUpperCase()}(1)`,
          '',
          'NAME',
          `       ${manCmd} - simulated Linux command in Kali Web VM`,
          '',
          'DESCRIPTION',
          `       Executes the simulated ${manCmd} command inside the in-browser virtual environment.`
        ];
      }

      case 'iwconfig': {
        return [
          'lo        no wireless extensions.',
          'eth0      no wireless extensions.',
          '',
          'No wireless interfaces available in this VM.',
          'This is a simulated environment without physical wireless hardware.',
        ];
      }

      case 'iw': {
        const iwSub = args[0] || '';
        if (iwSub === 'dev') {
          return [
            'phy#0',
            '        Interface wlan0',
            '                ifindex 3',
            '                type managed',
            '',
            'No wireless devices found.',
          ];
        }
        return ['Usage: iw dev | iwconfig'];
      }

      case 'airmon-ng': {
        const airmonSub = args[0] || '';
        if (airmonSub === 'check') {
          if (args.includes('kill')) {
            return [
              '',
              'Please uninstall or comment out interfering processes:',
              '  NetworkManager',
              '  wpa_supplicant',
              '',
              'These processes may interfere with monitor mode.',
            ];
          }
          return [
            '',
            'Please uninstall or comment out interfering processes:',
            '  NetworkManager',
            '  wpa_supplicant',
          ];
        }
        if (airmonSub === 'start') {
          const iface = args[1];
          if (!iface) return ['Usage: airmon-ng start <interface>'];
          return [
            `Requested device ${iface} to be put into monitor mode.`,
            `Monitor mode vif enabled on mon0`,
            `Monitor mode vif ${iface} -> mon0`,
          ];
        }
        if (airmonSub === 'stop') {
          const iface = args[1];
          if (!iface) return ['Usage: airmon-ng stop <interface>'];
          return [
            `Interface ${iface} removed from monitor mode.`,
          ];
        }
        return [
          'Airmon-ng - Wireless Monitor Mode Management',
          '',
          'PHY     Interface   Driver      Chipset',
          '',
          'No wireless interfaces available in this VM.',
          '',
          'This is a simulated educational environment.',
        ];
      }

      case 'ip': {
        const ipSub = args[0] || '';
        if (ipSub === 'addr' || ipSub === 'address') {
          return [
            '1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536',
            '    inet 127.0.0.1/8 scope lo',
            '    inet6 ::1/128 scope host',
            '',
            '2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500',
            '    inet 192.168.56.101/24 brd 192.168.56.255 scope global eth0',
            '',
            'No wireless interfaces available in this VM.',
          ];
        }
        if (ipSub === 'link') {
          return [
            '1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue',
            '    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00',
            '2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc pfifo_fast',
            '    link/ether 08:00:27:8e:d4:41 brd ff:ff:ff:ff:ff:ff',
            '',
            'No wireless interfaces available in this VM.',
          ];
        }
        if (ipSub === 'route') {
          return [
            'default via 192.168.56.1 dev eth0 proto dhcp metric 100',
            '192.168.56.0/24 dev eth0 proto kernel scope link src 192.168.56.101 metric 100',
          ];
        }
        if (ipSub === '-h' || ipSub === '--help' || args.includes('help')) {
          return [
            'Usage: ip [OPTIONS] OBJECT { COMMAND | help }',
            '',
            'OBJECT := { link | addr | route | neigh | tunnel }',
            'OPTIONS := { -V[ersion] | -s[tatistics] | -h[uman] | -j[son] }',
          ];
        }
        return [
          '1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue',
          '2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc pfifo_fast',
          '',
          'No wireless interfaces available in this VM.',
        ];
      }

      case 'ifconfig':
        return [
          'eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500',
          '        inet 192.168.56.101  netmask 255.255.255.0  broadcast 192.168.56.255',
          '        ether 08:00:27:8e:d4:41  txqueuelen 1000',
          '',
          'lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536',
          '        inet 127.0.0.1  netmask 255.0.0.0',
          '',
          'No wireless interfaces available in this VM.',
        ];

      case 'ping': {
        const host = args[0] || '8.8.8.8';
        return [
          `PING ${host} (${host}) 56(84) bytes of data.`,
          `64 bytes from ${host}: icmp_seq=1 ttl=118 time=14.2 ms`,
          `64 bytes from ${host}: icmp_seq=2 ttl=118 time=12.8 ms`,
          `64 bytes from ${host}: icmp_seq=3 ttl=118 time=15.1 ms`,
          `64 bytes from ${host}: icmp_seq=4 ttl=118 time=13.4 ms`,
          '',
          `--- ${host} ping statistics ---`,
          '4 packets transmitted, 4 received, 0% packet loss, time 3004ms',
          'rtt min/avg/max/mdev = 12.812/13.875/15.120/0.892 ms'
        ];
      }

      case 'curl': {
        const url = args[0] || 'http://kali.local';
        return [
          `<!DOCTYPE html>`,
          `<html><head><title>Kali Web VM Server</title></head>`,
          `<body><h1>200 OK</h1><p>Response from ${url}</p></body></html>`
        ];
      }

      case 'ps': {
        return [
          'PID   USER     TIME  COMMAND',
          '    1 root     0:02  /sbin/init',
          '  312 root     0:00  /lib/systemd/systemd-journald',
          '  412 root     0:01  NetworkManager',
          '  823 kali     0:04  xfce4-session',
          '  831 kali     0:02  xfwm4',
          '  845 kali     0:05  xfce4-panel',
          '  850 kali     0:03  xfdesktop',
          '  901 kali     0:01  pulseaudio',
          ' 1024 kali     0:08  xterm-256color',
          ' 1042 kali     0:00  bash'
        ];
      }

      case 'top':
        return [
          'top - 12:35:00 up 2 days, 4:12,  2 users,  load average: 0.12, 0.08, 0.01',
          'Tasks: 98 total,   1 running,  97 sleeping,   0 stopped,   0 zombie',
          '%Cpu(s):  4.2 us,  1.8 sy,  0.0 ni, 93.8 id,  0.1 wa,  0.0 hi,  0.1 si',
          'MiB Mem :   3924.2 total,   1842.1 free,   1210.4 used,    871.7 buff/cache',
          'MiB Swap:   2048.0 total,   2048.0 free,      0.0 used.   2450.6 avail Mem',
          '',
          '  PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND',
          '  845 kali      20   0  421040  68240  41200 S   2.1   1.7   0:05.12 xfce4-panel',
          ' 1024 kali      20   0  210480  42100  28100 S   1.4   1.1   0:08.45 xterm',
          '  823 kali      20   0  389120  54120  32900 S   0.7   1.4   0:04.01 xfce4-session'
        ];

      case 'free':
        return [
          '               total        used        free      shared  buff/cache   available',
          'Mem:         4018384     1239448     1886504       72412      892432     2510200',
          'Swap:        2097148           0     2097148'
        ];

      case 'df':
        return [
          'Filesystem     1K-blocks     Used Available Use% Mounted on',
          'udev             1982400        0   1982400   0% /dev',
          'tmpfs             401840     1420    400420   1% /run',
          '/dev/sda1       61892408 19182904  39537120  33% /',
          'tmpfs            2009192        0   2009192   0% /dev/shm'
        ];

      case 'neofetch':
        return [
          '  \x1b[34m      .---.        \x1b[0m \x1b[36mOS:\x1b[0m Kali Web VM (x86_64)',
          '  \x1b[34m     /     \\       \x1b[0m \x1b[36mHost:\x1b[0m Browser Virtual Machine',
          '  \x1b[34m    | () () |      \x1b[0m \x1b[36mKernel:\x1b[0m 6.5.0-kali3-amd64',
          '  \x1b[34m     \\  _  /       \x1b[0m \x1b[36mUptime:\x1b[0m 2 days, 4 hours, 12 mins',
          '  \x1b[34m      /   \\        \x1b[0m \x1b[36mPackages:\x1b[0m 2841 (dpkg)',
          '  \x1b[34m     /|   |\\       \x1b[0m \x1b[36mShell:\x1b[0m bash 5.2.15',
          '  \x1b[34m    /_|___|_\\      \x1b[0m \x1b[36mDE:\x1b[0m Xfce 4.18',
          '  \x1b[34m      |   |        \x1b[0m \x1b[36mWM:\x1b[0m Xfwm4',
          '  \x1b[34m      |   |        \x1b[0m \x1b[36mTerminal:\x1b[0m xterm-256color',
          '  \x1b[34m      |___|        \x1b[0m \x1b[36mCPU:\x1b[0m Virtual 4-Core CPU @ 2.80GHz',
          '                     \x1b[36mMemory:\x1b[0m 1210MiB / 3924MiB'
        ];

      case 'python3':
      case 'python':
        if (args.includes('-c') && args.length > 1) {
          const code = args.slice(args.indexOf('-c') + 1).join(' ').replace(/^["']|["']$/g, '');
          if (code.startsWith('print(')) {
            const match = code.match(/print\((.*)\)/);
            return [match ? match[1].replace(/^["']|["']$/g, '') : ''];
          }
          return ['Simulated Python 3.11 runtime'];
        }
        return ['Python 3.11.6 (main, Oct  8 2023, 05:06:43) [GCC 13.2.0] on linux', 'Type "help", "copyright", "credits" or "license" for more information.'];

      case 'git':
        return ['git version 2.40.1', 'usage: git [--version] [--help] [-C <path>] <command> [<args>]'];

      case 'nano':
      case 'vim':
      case 'vi':
        return [`[Notice] Please open '${args[0] || 'file'}' using the graphical Text Editor from the Applications menu or dock.`];

      default:
        return [`bash: ${cmd}: command not found`];
    }
  }
}

export default CommandInterpreter;

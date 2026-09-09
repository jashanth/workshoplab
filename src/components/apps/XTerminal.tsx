import { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { useStore } from '../../store';
import { sessionManager } from '../../services/session';
import CommandInterpreter from '../../services/commands';
import { getFileSystem, saveFileSystem } from '../../store/filesystem-store';
import { terminalThemes } from '../../services/terminal-themes';
import { restartVM, shutdownVM } from '../../services/vm-actions';

export default function XTerminal() {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const commandInterpreterRef = useRef<CommandInterpreter | null>(null);
  const inputBufferRef = useRef<string>('');
  const [cwd, setCwd] = useState('/home/kali');

  const { settings, sessionState } = useStore();
  const theme = terminalThemes[settings.terminalTheme] || terminalThemes.kali;

  useEffect(() => {
    if (!terminalRef.current || xtermRef.current) return;

    // Initialize xterm.js
    const terminal = new Terminal({
      cursorBlink: true,
      cursorStyle: settings.cursorStyle,
      fontSize: settings.terminalFontSize,
      fontFamily: '"JetBrains Mono", "Consolas", "Monaco", "Courier New", monospace',
      theme: {
        background: theme.background,
        foreground: theme.foreground,
        cursor: theme.cursor,
        selectionBackground: theme.selection,
        black: theme.black,
        red: theme.red,
        green: theme.green,
        yellow: theme.yellow,
        blue: theme.blue,
        magenta: theme.magenta,
        cyan: theme.cyan,
        white: theme.white,
        brightBlack: theme.black,
        brightRed: theme.red,
        brightGreen: theme.green,
        brightYellow: theme.yellow,
        brightBlue: theme.blue,
        brightMagenta: theme.magenta,
        brightCyan: theme.cyan,
        brightWhite: theme.white,
      },
      allowTransparency: false,
      scrollback: 10000,
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    terminal.loadAddon(fitAddon);
    terminal.loadAddon(webLinksAddon);
    terminal.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = terminal;
    fitAddonRef.current = fitAddon;

    // Initialize command interpreter for offline mode
    const fs = getFileSystem();
    const env = new Map([
      ['HOME', '/home/kali'],
      ['USER', settings.username],
      ['SHELL', '/bin/bash'],
      ['TERM', 'xterm-256color'],
      ['PATH', '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin'],
    ]);
    commandInterpreterRef.current = new CommandInterpreter(fs, env);

    // Show welcome message
    showWelcome(terminal);

    // Check session mode
    const mode = sessionState?.mode || 'offline';
    if (mode === 'online') {
      const ws = sessionManager.getTerminalWebSocket();
      if (ws && ws.isConnected()) {
        terminal.writeln('\r\n\x1b[32m[Connected to Kali Linux container]\x1b[0m');
        setupWebSocketMode(terminal, ws);
      } else {
        terminal.writeln('\r\n\x1b[33m[WebSocket not connected, using offline mode]\x1b[0m');
        setupOfflineMode(terminal);
      }
    } else {
      terminal.writeln('\r\n\x1b[33m[Backend unavailable - Running in offline simulation mode]\x1b[0m');
      terminal.writeln('\x1b[90m[Commands are simulated using virtual filesystem]\x1b[0m');
      setupOfflineMode(terminal);
    }

    // Handle resize
    const resizeObserver = new ResizeObserver(() => {
      fitAddon.fit();
    });
    resizeObserver.observe(terminalRef.current);

    return () => {
      resizeObserver.disconnect();
      terminal.dispose();
    };
  }, []);

  const showWelcome = (terminal: Terminal) => {
    terminal.writeln('\x1b[36m╔══════════════════════════════════════════════════════════╗\x1b[0m');
    terminal.writeln('\x1b[36m║\x1b[0m         Welcome to Kali Linux Web Virtual Machine        \x1b[36m║\x1b[0m');
    terminal.writeln('\x1b[36m║\x1b[0m                 Browser-Based Environment                 \x1b[36m║\x1b[0m');
    terminal.writeln('\x1b[36m╚══════════════════════════════════════════════════════════╝\x1b[0m');
    terminal.writeln('');
    terminal.writeln(' \x1b[90m*\x1b[0m Type \x1b[33mhelp\x1b[0m for a list of available commands.');
    terminal.writeln(' \x1b[90m*\x1b[0m Type \x1b[33mneofetch\x1b[0m for system information.');
  };

  const setupOfflineMode = (terminal: Terminal) => {
    writePrompt(terminal);

    terminal.onData((data) => {
      const code = data.charCodeAt(0);

      // Handle special keys
      if (code === 13) { // Enter
        terminal.write('\r\n');
        const command = inputBufferRef.current;
        inputBufferRef.current = '';

        if (command.trim()) {
          executeOfflineCommand(terminal, command.trim());
        } else {
          writePrompt(terminal);
        }
      } else if (code === 127) { // Backspace
        if (inputBufferRef.current.length > 0) {
          inputBufferRef.current = inputBufferRef.current.slice(0, -1);
          terminal.write('\b \b');
        }
      } else if (code === 3) { // Ctrl+C
        terminal.write('^C\r\n');
        inputBufferRef.current = '';
        writePrompt(terminal);
      } else if (code === 12) { // Ctrl+L
        terminal.clear();
        writePrompt(terminal);
      } else if (code >= 32 && code <= 126) { // Printable characters
        inputBufferRef.current += data;
        terminal.write(data);
      }
    });
  };

  const setupWebSocketMode = (terminal: Terminal, ws: any) => {
    // Receive data from backend
    ws.onData((data: string) => {
      terminal.write(data);
    });

    // Send terminal input to backend
    terminal.onData((data) => {
      ws.send(data);
    });

    // Send terminal resize to backend
    terminal.onResize(({ cols, rows }) => {
      ws.resize(cols, rows);
    });

    // Trigger initial resize
    if (fitAddonRef.current) {
      const { cols, rows } = xtermRef.current!;
      ws.resize(cols, rows);
    }
  };

  const executeOfflineCommand = (terminal: Terminal, command: string) => {
    if (!commandInterpreterRef.current) {
      writePrompt(terminal);
      return;
    }

    if (command === 'clear') {
      terminal.clear();
      writePrompt(terminal);
      return;
    }

    if (command === 'exit') {
      terminal.writeln('Use the window close button to close the terminal.');
      writePrompt(terminal);
      return;
    }

    const trimmed = command.trim();
    let eventType: 'create' | 'update' | 'delete' | 'rename' | undefined;
    let eventPath: string | undefined;
    const cwd = commandInterpreterRef.current.getCwd();

    if (trimmed.startsWith('mkdir ')) {
      eventType = 'create';
      eventPath = cwd + '/' + trimmed.split(' ')[1];
    } else if (trimmed.startsWith('touch ')) {
      eventType = 'create';
      eventPath = cwd + '/' + trimmed.split(' ')[1];
    } else if (trimmed.startsWith('rm ')) {
      eventType = 'delete';
      const pathPart = trimmed.split(' ')[1];
      if (pathPart) eventPath = cwd + '/' + pathPart;
    } else if (trimmed.includes('>')) {
      eventType = 'update';
      eventPath = cwd + '/' + trimmed.split('>')[0].trim();
    }

    const output = commandInterpreterRef.current.execute(command);

    // Detect simulated power commands by inspecting the original trimmed command
    const isReboot = /^(sudo\s+)?reboot$/i.test(trimmed);
    const isShutdown = /^(sudo\s+)?shutdown(\s+now)?$/i.test(trimmed);

    // Update cwd from interpreter
    const newCwd = commandInterpreterRef.current.getCwd();
    if (newCwd !== cwd) {
      setCwd(newCwd);
    }

    output.forEach((line) => {
      // Color error lines (skip empty lines from power commands)
      if (line && (line.startsWith('bash:') || line.startsWith('ls:') || line.includes(': command not found'))) {
        terminal.writeln(`\x1b[31m${line}\x1b[0m`);
      } else if (line) {
        terminal.writeln(line);
      }
    });

    if (isReboot) {
      restartVM();
      return;
    }

    if (isShutdown) {
      shutdownVM();
      return;
    }

    saveFileSystem(eventType, eventPath);
    writePrompt(terminal);
  };

  const writePrompt = (terminal: Terminal) => {
    const username = settings.username || 'kali';
    const hostname = settings.hostname || 'kali';
    const displayCwd = cwd.replace('/home/kali', '~');

    terminal.write(`\r\n\x1b[32m┌──(\x1b[34m${username}\x1b[32m㉿\x1b[34m${hostname}\x1b[32m)-[\x1b[37m${displayCwd}\x1b[32m]\r\n`);
    terminal.write(`\x1b[32m└─\x1b[34m$\x1b[0m `);
  };

  return (
    <div className="w-full h-full bg-black">
      <div ref={terminalRef} className="w-full h-full" />
    </div>
  );
}

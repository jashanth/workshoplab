import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useStore } from '../../store';
import { getFileSystem, saveFileSystem } from '../../store/filesystem-store';
import { terminalThemes } from '../../services/terminal-themes';
import CommandInterpreter from '../../services/commands';
import { ShellStack } from '../../services/shell-state';
import { AuthService } from '../../services/auth';
import { restartVM, shutdownVM } from '../../services/vm-actions';
import type { TerminalLine } from '../../types';

export default function Terminal() {
  const { settings, closeWindow, windows } = useStore();
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyPos, setHistoryPos] = useState(-1);
  const [cwd, setCwd] = useState('/home/kali');
  const [pendingSudo, setPendingSudo] = useState(false);
  const [sudoUser, setSudoUser] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const commandInterpreterRef = useRef<CommandInterpreter | null>(null);
  const shellStackRef = useRef<ShellStack | null>(null);

  const theme = terminalThemes[settings.terminalTheme] || terminalThemes.kali;

  // Initialize command interpreter and shell stack
  useEffect(() => {
    const fs = getFileSystem();
    const env = new Map([
      ['HOME', '/home/kali'],
      ['USER', settings.username],
      ['SHELL', '/bin/bash'],
      ['TERM', 'xterm-256color'],
      ['PATH', '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin'],
    ]);
    commandInterpreterRef.current = new CommandInterpreter(fs, env);
    shellStackRef.current = new ShellStack(settings.username, '/home/kali');

    // Welcome message
    const welcomeLines: TerminalLine[] = [
      {
        id: crypto.randomUUID(),
        type: 'system',
        content: '╔══════════════════════════════════════════════════════════╗',
        timestamp: Date.now(),
      },
      {
        id: crypto.randomUUID(),
        type: 'system',
        content: '║         Welcome to Kali Linux Web Virtual Machine        ║',
        timestamp: Date.now(),
      },
      {
        id: crypto.randomUUID(),
        type: 'system',
        content: '║                 Simulation Environment                   ║',
        timestamp: Date.now(),
      },
      {
        id: crypto.randomUUID(),
        type: 'system',
        content: '╚══════════════════════════════════════════════════════════╝',
        timestamp: Date.now(),
      },
      {
        id: crypto.randomUUID(),
        type: 'system',
        content: '',
        timestamp: Date.now(),
      },
      {
        id: crypto.randomUUID(),
        type: 'system',
        content: ' * Type "help" for a list of available commands.',
        timestamp: Date.now(),
      },
      {
        id: crypto.randomUUID(),
        type: 'system',
        content: ' * Type "neofetch" for system information.',
        timestamp: Date.now(),
      },
      {
        id: crypto.randomUUID(),
        type: 'system',
        content: ' * Files created here will persist across page refreshes.',
        timestamp: Date.now(),
      },
      {
        id: crypto.randomUUID(),
        type: 'system',
        content: '',
        timestamp: Date.now(),
      },
    ];

    setLines(welcomeLines);
  }, [settings.username, settings.hostname]);

  // Focus input on mount and click
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [lines]);

  const addLine = useCallback((type: TerminalLine['type'], content: string) => {
    setLines(prev => [...prev, {
      id: crypto.randomUUID(),
      type,
      content,
      timestamp: Date.now(),
    }]);
  }, []);

  const handleSudoLogin = async () => {
    const shellStack = shellStackRef.current;
    if (!shellStack) return;

    const result = await AuthService.login({ username: sudoUser, password: input });
    if (result.success) {
      shellStack.pushRoot();
      addLine('output', `root@${settings.hostname}:${cwd}#`);
    } else {
      addLine('error', 'Sorry, try again.');
    }
    setPendingSudo(false);
    setSudoUser('');
    setInput('');
    // Re-focus input
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleCommand = useCallback((cmd: string) => {
    const trimmed = cmd.trim();
    const shellStack = shellStackRef.current;
    if (!shellStack) return;

    const isRoot = shellStack.isRootShell();
    const promptChar = isRoot ? '#' : '$';
    const user = shellStack.getCurrentUser();

    // Handle sudo password prompt
    if (pendingSudo) {
      handleSudoLogin();
      return;
    }

    // Add command input line with prompt
    const displayCwd = cwd.replace(`/home/${user}`, '~').replace('/root', '~');
    const promptPrefix = `┌──(${user}㉿${settings.hostname})-[${displayCwd}]\n└─${promptChar} ${cmd}`;
    addLine('input', promptPrefix);

    if (!trimmed) {
      return;
    }

    // Add to history
    setHistory(prev => [...prev, trimmed]);
    setHistoryPos(-1);

    if (!commandInterpreterRef.current) return;

    // Handle special shell commands
    if (trimmed === 'sudo su' || trimmed === 'sudo -i') {
      addLine('output', `[sudo] password for ${user}: `);
      setPendingSudo(true);
      setSudoUser(user);
      setInput('');
      // Focus will be restored after password prompt
      return;
    }

    if (trimmed === 'exit') {
      if (shellStack.pop()) {
        const newShell = shellStack.current();
        setCwd(newShell.cwd);
        addLine('output', 'exit');
      } else {
        // Exit main shell - close terminal
        const activeWin = windows.find(w => w.isActive && w.component === 'Terminal');
        if (activeWin) {
          closeWindow(activeWin.id);
        }
      }
      return;
    }

    // Execute command
    const output = commandInterpreterRef.current.execute(trimmed);

    const isReboot = /^(sudo\s+)?reboot$/i.test(trimmed);
    const isShutdown = /^(sudo\s+)?shutdown(\s+now)?$/i.test(trimmed);

    // Handle special outputs
    if (output.length === 1 && output[0] === '__CLEAR__') {
      setLines([]);
      return;
    }

    if (output.length === 1 && output[0] === '__EXIT__') {
      if (shellStack.pop()) {
        const newShell = shellStack.current();
        setCwd(newShell.cwd);
      } else {
        const activeWin = windows.find(w => w.isActive && w.component === 'Terminal');
        if (activeWin) {
          closeWindow(activeWin.id);
        }
      }
      return;
    }

    if (isReboot) {
      restartVM();
      return;
    }

    if (isShutdown) {
      shutdownVM();
      return;
    }

    // Update current working directory from interpreter
    const currentInterpreterCwd = commandInterpreterRef.current.getCwd();
    if (currentInterpreterCwd !== cwd) {
      setCwd(currentInterpreterCwd);
      shellStack.updateCwd(currentInterpreterCwd);
    }

    // Output results
    output.forEach(line => {
      let lineType: TerminalLine['type'] = 'output';
      if (line.startsWith('bash:') || line.startsWith('ls:') || line.startsWith('cat:') || line.startsWith('mkdir:') || line.startsWith('rm:')) {
        lineType = 'error';
      }
      addLine(lineType, line);
    });

    // Determine what kind of filesystem operation occurred
    let eventType: 'create' | 'update' | 'delete' | undefined;
    let eventPath: string | undefined;

    if (trimmed.startsWith('mkdir ')) {
      eventType = 'create';
      const path = trimmed.split(' ')[1];
      eventPath = commandInterpreterRef.current.getCwd() + '/' + path;
    } else if (trimmed.startsWith('touch ')) {
      eventType = 'create';
      const path = trimmed.split(' ')[1];
      eventPath = commandInterpreterRef.current.getCwd() + '/' + path;
    } else if (trimmed.startsWith('rm ')) {
      eventType = 'delete';
    } else if (trimmed.includes('>')) {
      eventType = 'update';
    }

    // Save filesystem changes with event notification
    saveFileSystem(eventType, eventPath);
  }, [addLine, cwd, settings.hostname, windows, closeWindow, pendingSudo, input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        handleCommand(input);
        if (!pendingSudo) {
          setInput('');
        }
        break;

      case 'ArrowUp':
        e.preventDefault();
        if (history.length > 0) {
          const newPos = historyPos === -1 ? history.length - 1 : Math.max(0, historyPos - 1);
          setHistoryPos(newPos);
          setInput(history[newPos]);
        }
        break;

      case 'ArrowDown':
        e.preventDefault();
        if (historyPos !== -1) {
          const newPos = historyPos + 1;
          if (newPos >= history.length) {
            setHistoryPos(-1);
            setInput('');
          } else {
            setHistoryPos(newPos);
            setInput(history[newPos]);
          }
        }
        break;

      case 'Tab':
        e.preventDefault();
        // Autocomplete file/dir names
        const words = input.split(' ');
        const currentWord = words[words.length - 1];
        if (currentWord) {
          try {
            const fs = getFileSystem();
            const items = fs.ls(cwd);
            const matches = items.filter(name => name.startsWith(currentWord));
            if (matches.length === 1) {
              words[words.length - 1] = matches[0];
              setInput(words.join(' '));
            }
          } catch {
            // Ignore autocomplete errors
          }
        }
        break;

      case 'c':
        if (e.ctrlKey) {
          e.preventDefault();
          addLine('output', '^C');
          setInput('');
          setPendingSudo(false);
        }
        break;

      case 'l':
        if (e.ctrlKey) {
          e.preventDefault();
          setLines([]);
        }
        break;

      default:
        break;
    }
  };

  const getLineColor = (type: TerminalLine['type']) => {
    switch (type) {
      case 'input':
        return theme.prompt;
      case 'error':
        return theme.red;
      case 'system':
        return theme.cyan;
      default:
        return theme.foreground;
    }
  };

  const displayCwd = cwd.replace('/home/kali', '~').replace('/root', '~');
  const currentUser = shellStackRef.current?.getCurrentUser() || settings.username;
  const isRoot = shellStackRef.current?.isRootShell() || false;

  return (
    <div
      className="flex flex-col h-full w-full font-mono select-text cursor-text"
      style={{
        backgroundColor: theme.background,
        color: theme.foreground,
        fontSize: `${settings.terminalFontSize}px`,
      }}
      onClick={() => inputRef.current?.focus()}
    >
      {/* Terminal Output Area */}
      <div
        ref={outputRef}
        className="flex-1 overflow-y-auto p-3 space-y-1 select-text"
      >
        {lines.map((line) => (
          <div
            key={line.id}
            className="whitespace-pre-wrap break-words leading-relaxed"
            style={{ color: getLineColor(line.type) }}
          >
            {line.content}
          </div>
        ))}

        {/* Active Input Line */}
        <div className="flex flex-col mt-2">
          {/* Prompt line 1 */}
          <div style={{ color: isRoot ? theme.red : theme.prompt }}>
            ┌──({currentUser}㉿{settings.hostname})-[{displayCwd}]
          </div>

          {/* Prompt line 2 + Input */}
          <div className="flex items-center">
            <span style={{ color: isRoot ? theme.red : theme.prompt }} className="mr-2">
              └─{isRoot ? '#' : '$'}
            </span>
            <input
              ref={inputRef}
              type={pendingSudo ? 'password' : 'text'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent border-none outline-none p-0 font-mono"
              style={{
                color: theme.foreground,
                caretColor: theme.cursor,
                fontSize: `${settings.terminalFontSize}px`,
              }}
              autoFocus
              spellCheck={false}
              autoComplete="off"
              autoCapitalize="off"
              placeholder={pendingSudo ? 'Enter password for sudo...' : undefined}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
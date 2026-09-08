import type { FSNode } from '../types';

function mkDir(name: string, children: Record<string, FSNode> = {}): FSNode {
  return {
    name,
    type: 'directory',
    permissions: 'drwxr-xr-x',
    owner: 'root',
    group: 'root',
    size: 4096,
    modified: new Date(),
    children,
  };
}

function mkUserDir(name: string, children: Record<string, FSNode> = {}): FSNode {
  return {
    name,
    type: 'directory',
    permissions: 'drwxr-xr-x',
    owner: 'kali',
    group: 'kali',
    size: 4096,
    modified: new Date(),
    children,
  };
}

function mkFile(name: string, content: string, owner = 'root', permissions = '-rw-r--r--'): FSNode {
  return {
    name,
    type: 'file',
    permissions,
    owner,
    group: owner,
    size: content.length,
    modified: new Date(),
    content,
  };
}

function createDefaultFS(): FSNode {
  return mkDir('/', {
    bin: mkDir('bin', {
      bash: mkFile('bash', '', 'root', '-rwxr-xr-x'),
      ls: mkFile('ls', '', 'root', '-rwxr-xr-x'),
      cat: mkFile('cat', '', 'root', '-rwxr-xr-x'),
      cp: mkFile('cp', '', 'root', '-rwxr-xr-x'),
      mv: mkFile('mv', '', 'root', '-rwxr-xr-x'),
      rm: mkFile('rm', '', 'root', '-rwxr-xr-x'),
      mkdir: mkFile('mkdir', '', 'root', '-rwxr-xr-x'),
      touch: mkFile('touch', '', 'root', '-rwxr-xr-x'),
      echo: mkFile('echo', '', 'root', '-rwxr-xr-x'),
      grep: mkFile('grep', '', 'root', '-rwxr-xr-x'),
      find: mkFile('find', '', 'root', '-rwxr-xr-x'),
      pwd: mkFile('pwd', '', 'root', '-rwxr-xr-x'),
    }),
    boot: mkDir('boot', {
      'vmlinuz-6.5.0-kali': mkFile('vmlinuz-6.5.0-kali', ''),
      'initrd.img-6.5.0-kali': mkFile('initrd.img-6.5.0-kali', ''),
    }),
    dev: mkDir('dev', {
      null: mkFile('null', ''),
      zero: mkFile('zero', ''),
      random: mkFile('random', ''),
      tty: mkFile('tty', ''),
    }),
    etc: mkDir('etc', {
      hostname: mkFile('hostname', 'kali\n'),
      passwd: mkFile('passwd', [
        'root:x:0:0:root:/root:/bin/bash',
        'daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin',
        'bin:x:2:2:bin:/bin:/usr/sbin/nologin',
        'sys:x:3:3:sys:/dev:/usr/sbin/nologin',
        'www-data:x:33:33:www-data:/var/www:/usr/sbin/nologin',
        'nobody:x:65534:65534:nobody:/nonexistent:/usr/sbin/nologin',
        'kali:x:1000:1000:Kali User:/home/kali:/bin/bash',
      ].join('\n') + '\n'),
      'os-release': mkFile('os-release', [
        'PRETTY_NAME="Kali Web VM 2024.3"',
        'NAME="Kali Web VM"',
        'VERSION_ID="2024.3"',
        'VERSION="2024.3"',
        'ID=kali',
        'ID_LIKE=debian',
        'HOME_URL="https://kali-web-vm.local"',
        'SUPPORT_URL="https://kali-web-vm.local/support"',
        'BUG_REPORT_URL="https://kali-web-vm.local/bugs"',
      ].join('\n') + '\n'),
      'resolv.conf': mkFile('resolv.conf', 'nameserver 192.168.56.1\nnameserver 8.8.8.8\n'),
      fstab: mkFile('fstab', '# Virtual filesystem table\n/dev/sda1  /  ext4  defaults  0  1\n'),
      shells: mkFile('shells', '/bin/sh\n/bin/bash\n'),
      profile: mkFile('profile', '# System-wide profile\nexport PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"\n'),
      shadow: mkFile('shadow', 'root:*:19000:0:99999:7:::\nkali:$6$simulated:19000:0:99999:7:::\n', 'root', '-rw-------'),
    }),
    home: mkDir('home', {
      kali: mkUserDir('kali', {
        Desktop: mkUserDir('Desktop', {
          'README.txt': mkFile('README.txt', [
            '╔══════════════════════════════════════════╗',
            '║       Welcome to Kali Web VM!            ║',
            '╠══════════════════════════════════════════╣',
            '║                                          ║',
            '║  This is a browser-based simulation of   ║',
            '║  a Kali Linux desktop environment.       ║',
            '║                                          ║',
            '║  Features:                               ║',
            '║  • Interactive terminal with commands     ║',
            '║  • Virtual filesystem                    ║',
            '║  • File manager                          ║',
            '║  • Text editor                           ║',
            '║  • Security lab tools                    ║',
            '║  • System monitor                        ║',
            '║                                          ║',
            '║  Open the terminal with Ctrl+Alt+T       ║',
            '║                                          ║',
            '║  Type "help" for available commands.     ║',
            '║                                          ║',
            '╚══════════════════════════════════════════╝',
          ].join('\n'), 'kali'),
        }),
        Documents: mkUserDir('Documents', {
          'notes.txt': mkFile('notes.txt', '# My Notes\n\nWelcome to Kali Web VM.\nFeel free to create and edit files here.\n', 'kali'),
          'todo.txt': mkFile('todo.txt', '[ ] Explore the terminal\n[ ] Try security lab tools\n[ ] Customize settings\n[ ] Learn Linux commands\n', 'kali'),
        }),
        Downloads: mkUserDir('Downloads'),
        Music: mkUserDir('Music'),
        Pictures: mkUserDir('Pictures', {
          'wallpapers': mkUserDir('wallpapers'),
        }),
        Videos: mkUserDir('Videos'),
        '.bashrc': mkFile('.bashrc', [
          '# ~/.bashrc: executed by bash for non-login shells.',
          '',
          'export PS1="\\[\\033[1;32m\\]┌──(\\u㉿\\h)-[\\w]\\n└─\\$\\[\\033[0m\\] "',
          '',
          'alias ll="ls -la"',
          'alias la="ls -A"',
          'alias l="ls -CF"',
          '',
          'export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"',
          'export TERM="xterm-256color"',
          'export LANG="en_US.UTF-8"',
          'export EDITOR="nano"',
        ].join('\n') + '\n', 'kali'),
        '.bash_history': mkFile('.bash_history', '', 'kali'),
        '.profile': mkFile('.profile', '# ~/.profile\n\nif [ -f "$HOME/.bashrc" ]; then\n  . "$HOME/.bashrc"\nfi\n', 'kali'),
      }),
    }),
    opt: mkDir('opt'),
    root: mkDir('root', {
      '.bashrc': mkFile('.bashrc', 'export PS1="\\[\\033[1;31m\\]root@kali\\[\\033[0m\\]:\\w# "'),
    }),
    tmp: mkDir('tmp'),
    usr: mkDir('usr', {
      bin: mkDir('bin', {
        python3: mkFile('python3', '', 'root', '-rwxr-xr-x'),
        git: mkFile('git', '', 'root', '-rwxr-xr-x'),
        curl: mkFile('curl', '', 'root', '-rwxr-xr-x'),
        wget: mkFile('wget', '', 'root', '-rwxr-xr-x'),
        nano: mkFile('nano', '', 'root', '-rwxr-xr-x'),
        vim: mkFile('vim', '', 'root', '-rwxr-xr-x'),
        nmap: mkFile('nmap', '', 'root', '-rwxr-xr-x'),
      }),
      lib: mkDir('lib'),
      share: mkDir('share', {
        doc: mkDir('doc'),
        man: mkDir('man'),
      }),
    }),
    var: mkDir('var', {
      log: mkDir('log', {
        syslog: mkFile('syslog', [
          `${new Date().toISOString()} kali kernel: [    0.000000] Linux version 6.5.0-kali (simulated)`,
          `${new Date().toISOString()} kali kernel: [    0.000000] Command line: BOOT_IMAGE=/vmlinuz-6.5.0-kali root=/dev/sda1`,
          `${new Date().toISOString()} kali systemd[1]: Started System Logging Service.`,
          `${new Date().toISOString()} kali NetworkManager[412]: <info> device (eth0): state change: ip-config -> activated`,
          `${new Date().toISOString()} kali systemd[1]: Started User Manager for UID 1000.`,
        ].join('\n') + '\n'),
        'auth.log': mkFile('auth.log', `${new Date().toISOString()} kali sshd[1234]: Server listening on 0.0.0.0 port 22.\n`),
        'kern.log': mkFile('kern.log', `${new Date().toISOString()} kali kernel: [    0.000000] Initializing virtual filesystem\n`),
      }),
      tmp: mkDir('tmp'),
      www: mkDir('www', {
        html: mkDir('html', {
          'index.html': mkFile('index.html', '<html><body><h1>Welcome to Kali Web VM</h1></body></html>\n'),
        }),
      }),
    }),
  });
}

export class VirtualFileSystem {
  private root: FSNode;
  private _cwd: string;
  private homeDir: string;

  constructor() {
    this.root = createDefaultFS();
    this._cwd = '/home/kali';
    this.homeDir = '/home/kali';
  }

  get cwd(): string {
    return this._cwd;
  }

  /** Normalize an absolute path: resolve ., .., and ~ */
  resolve(inputPath: string): string {
    let path = inputPath.trim();
    if (path === '') return this._cwd;

    // Expand ~
    if (path === '~') return this.homeDir;
    if (path.startsWith('~/')) path = this.homeDir + path.slice(1);

    // Make relative paths absolute
    if (!path.startsWith('/')) {
      path = this._cwd + '/' + path;
    }

    const parts = path.split('/').filter(Boolean);
    const resolved: string[] = [];
    for (const part of parts) {
      if (part === '.') continue;
      if (part === '..') {
        resolved.pop();
      } else {
        resolved.push(part);
      }
    }
    return '/' + resolved.join('/');
  }

  /** Get the FSNode at a given path, or null */
  getNode(inputPath: string): FSNode | null {
    const path = this.resolve(inputPath);
    if (path === '/') return this.root;

    const parts = path.split('/').filter(Boolean);
    let node: FSNode = this.root;
    for (const part of parts) {
      if (node.type !== 'directory' || !node.children?.[part]) return null;
      node = node.children[part];
    }
    return node;
  }

  /** Get the parent directory node and the child name for a path */
  private getParentAndName(inputPath: string): { parent: FSNode; name: string } | null {
    const path = this.resolve(inputPath);
    const parts = path.split('/').filter(Boolean);
    if (parts.length === 0) return null; // can't get parent of root

    const name = parts.pop()!;
    let parent: FSNode = this.root;
    for (const part of parts) {
      if (parent.type !== 'directory' || !parent.children?.[part]) return null;
      parent = parent.children[part];
    }
    if (parent.type !== 'directory') return null;
    return { parent, name };
  }

  exists(inputPath: string): boolean {
    return this.getNode(inputPath) !== null;
  }

  isDirectory(inputPath: string): boolean {
    const node = this.getNode(inputPath);
    return node !== null && node.type === 'directory';
  }

  /** List directory contents; returns sorted array of names */
  ls(inputPath: string): string[] {
    const node = this.getNode(inputPath);
    if (!node) throw new Error(`ls: cannot access '${inputPath}': No such file or directory`);
    if (node.type !== 'directory') return [node.name];
    return Object.keys(node.children ?? {}).sort();
  }

  /** List directory with details: returns FSNode array */
  lsDetailed(inputPath: string): FSNode[] {
    const node = this.getNode(inputPath);
    if (!node) throw new Error(`ls: cannot access '${inputPath}': No such file or directory`);
    if (node.type !== 'directory') return [node];
    return Object.values(node.children ?? {}).sort((a, b) => a.name.localeCompare(b.name));
  }

  mkdir(inputPath: string, recursive = false): void {
    const path = this.resolve(inputPath);
    const parts = path.split('/').filter(Boolean);
    let current: FSNode = this.root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (!current.children) current.children = {};

      if (current.children[part]) {
        if (current.children[part].type !== 'directory') {
          throw new Error(`mkdir: cannot create directory '${inputPath}': Not a directory`);
        }
        if (i === parts.length - 1 && !recursive) {
          throw new Error(`mkdir: cannot create directory '${inputPath}': File exists`);
        }
        current = current.children[part];
      } else {
        if (i < parts.length - 1 && !recursive) {
          throw new Error(`mkdir: cannot create directory '${inputPath}': No such file or directory`);
        }
        const newDir: FSNode = {
          name: part,
          type: 'directory',
          permissions: 'drwxr-xr-x',
          owner: 'kali',
          group: 'kali',
          size: 4096,
          modified: new Date(),
          children: {},
        };
        current.children[part] = newDir;
        current = newDir;
      }
    }
  }

  touch(inputPath: string, content = ''): void {
    const pn = this.getParentAndName(inputPath);
    if (!pn) throw new Error(`touch: cannot touch '${inputPath}': No such file or directory`);
    const { parent, name } = pn;

    if (!parent.children) parent.children = {};
    if (parent.children[name]) {
      parent.children[name].modified = new Date();
      return;
    }

    parent.children[name] = {
      name,
      type: 'file',
      permissions: '-rw-r--r--',
      owner: 'kali',
      group: 'kali',
      size: content.length,
      modified: new Date(),
      content,
    };
  }

  writeFile(inputPath: string, content: string, append = false): void {
    const node = this.getNode(inputPath);

    if (node) {
      if (node.type === 'directory') throw new Error(`write: '${inputPath}': Is a directory`);
      node.content = append ? (node.content ?? '') + content : content;
      node.size = (node.content ?? '').length;
      node.modified = new Date();
      return;
    }

    // Create the file if it doesn't exist
    const pn = this.getParentAndName(inputPath);
    if (!pn) throw new Error(`write: cannot create '${inputPath}': No such file or directory`);
    const { parent, name } = pn;
    if (!parent.children) parent.children = {};

    parent.children[name] = {
      name,
      type: 'file',
      permissions: '-rw-r--r--',
      owner: 'kali',
      group: 'kali',
      size: content.length,
      modified: new Date(),
      content,
    };
  }

  readFile(inputPath: string): string {
    const node = this.getNode(inputPath);
    if (!node) throw new Error(`cat: '${inputPath}': No such file or directory`);
    if (node.type === 'directory') throw new Error(`cat: '${inputPath}': Is a directory`);
    return node.content ?? '';
  }

  rm(inputPath: string, recursive = false): void {
    const path = this.resolve(inputPath);
    if (path === '/') throw new Error("rm: cannot remove '/': Permission denied");

    const node = this.getNode(inputPath);
    if (!node) throw new Error(`rm: cannot remove '${inputPath}': No such file or directory`);

    if (node.type === 'directory' && !recursive) {
      throw new Error(`rm: cannot remove '${inputPath}': Is a directory`);
    }

    const pn = this.getParentAndName(inputPath);
    if (!pn) throw new Error(`rm: cannot remove '${inputPath}': Permission denied`);
    delete pn.parent.children![pn.name];
  }

  cp(src: string, dest: string): void {
    const srcNode = this.getNode(src);
    if (!srcNode) throw new Error(`cp: cannot stat '${src}': No such file or directory`);

    const clone = JSON.parse(JSON.stringify(srcNode)) as FSNode;
    clone.modified = new Date();

    const destNode = this.getNode(dest);
    if (destNode && destNode.type === 'directory') {
      // Copy into directory
      if (!destNode.children) destNode.children = {};
      clone.name = srcNode.name;
      destNode.children[srcNode.name] = clone;
    } else {
      // Copy with new name
      const pn = this.getParentAndName(dest);
      if (!pn) throw new Error(`cp: cannot create '${dest}': No such file or directory`);
      const destName = this.resolve(dest).split('/').pop()!;
      clone.name = destName;
      if (!pn.parent.children) pn.parent.children = {};
      pn.parent.children[destName] = clone;
    }
  }

  mv(src: string, dest: string): void {
    const srcNode = this.getNode(src);
    if (!srcNode) throw new Error(`mv: cannot stat '${src}': No such file or directory`);

    this.cp(src, dest);
    this.rm(src, srcNode.type === 'directory');
  }

  cd(inputPath: string): string {
    const path = this.resolve(inputPath);
    const node = this.getNode(path);
    if (!node) throw new Error(`cd: '${inputPath}': No such file or directory`);
    if (node.type !== 'directory') throw new Error(`cd: '${inputPath}': Not a directory`);
    this._cwd = path;
    return this._cwd;
  }

  stat(inputPath: string): FSNode {
    const node = this.getNode(inputPath);
    if (!node) throw new Error(`stat: cannot stat '${inputPath}': No such file or directory`);
    return node;
  }

  find(basePath: string, name: string): string[] {
    const results: string[] = [];
    const base = this.resolve(basePath);

    const search = (node: FSNode, currentPath: string) => {
      if (node.name.includes(name)) {
        results.push(currentPath);
      }
      if (node.type === 'directory' && node.children) {
        for (const [childName, child] of Object.entries(node.children)) {
          search(child, currentPath === '/' ? `/${childName}` : `${currentPath}/${childName}`);
        }
      }
    };

    const baseNode = this.getNode(basePath);
    if (!baseNode) throw new Error(`find: '${basePath}': No such file or directory`);
    search(baseNode, base);
    return results;
  }

  tree(inputPath: string, maxDepth = 3): string {
    const node = this.getNode(inputPath);
    if (!node) throw new Error(`tree: '${inputPath}': No such file or directory`);
    if (node.type !== 'directory') return node.name;

    const lines: string[] = [this.resolve(inputPath)];
    let dirs = 0;
    let files = 0;

    const walk = (n: FSNode, prefix: string, depth: number) => {
      if (depth > maxDepth) return;
      if (!n.children) return;

      const entries = Object.values(n.children).sort((a, b) => a.name.localeCompare(b.name));
      entries.forEach((child, i) => {
        const isLast = i === entries.length - 1;
        const connector = isLast ? '└── ' : '├── ';
        const nextPrefix = isLast ? '    ' : '│   ';

        lines.push(`${prefix}${connector}${child.name}`);
        if (child.type === 'directory') {
          dirs++;
          walk(child, prefix + nextPrefix, depth + 1);
        } else {
          files++;
        }
      });
    };

    walk(node, '', 1);
    lines.push('');
    lines.push(`${dirs} directories, ${files} files`);
    return lines.join('\n');
  }

  /** Serialize the entire filesystem to a JSON-safe object */
  serialize(): string {
    return JSON.stringify(this.root, (_key, value) => {
      if (value instanceof Date) return { __date__: value.toISOString() };
      return value;
    });
  }

  /** Deserialize from saved JSON */
  deserialize(data: string): void {
    this.root = JSON.parse(data, (_key, value) => {
      if (value && typeof value === 'object' && '__date__' in value) {
        return new Date(value.__date__);
      }
      return value;
    });
  }

  /** Restore to factory defaults */
  reset(): void {
    this.root = createDefaultFS();
    this._cwd = '/home/kali';
  }

  /** Get the contents of a directory suitable for GUI file browsing */
  getDirectoryContents(inputPath: string): FSNode[] {
    const node = this.getNode(inputPath);
    if (!node || node.type !== 'directory') return [];
    return Object.values(node.children ?? {}).sort((a, b) => {
      // directories first
      if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }
}

// Shell State Management
// Handles shell stack for nested shells (sudo su, su, exit)

export interface ShellState {
  user: string;
  isRoot: boolean;
  cwd: string;
  env: Map<string, string>;
}

export class ShellStack {
  private stack: ShellState[];

  constructor(initialUser: string = 'kali', initialCwd: string = '/home/kali') {
    this.stack = [{
      user: initialUser,
      isRoot: false,
      cwd: initialCwd,
      env: new Map([
        ['USER', initialUser],
        ['HOME', `/home/${initialUser}`],
        ['SHELL', '/bin/bash'],
        ['PWD', initialCwd],
      ]),
    }];
  }

  current(): ShellState {
    return this.stack[this.stack.length - 1];
  }

  pushRoot(): void {
    const current = this.current();
    this.stack.push({
      user: 'root',
      isRoot: true,
      cwd: current.cwd,
      env: new Map([
        ['USER', 'root'],
        ['HOME', '/root'],
        ['SHELL', '/bin/bash'],
        ['PWD', current.cwd],
      ]),
    });
  }

  pushUser(user: string): void {
    this.stack.push({
      user,
      isRoot: user === 'root',
      cwd: `/home/${user}`,
      env: new Map([
        ['USER', user],
        ['HOME', `/home/${user}`],
        ['SHELL', '/bin/bash'],
        ['PWD', `/home/${user}`],
      ]),
    });
  }

  pop(): boolean {
    if (this.stack.length <= 1) {
      return false; // Cannot exit the main shell
    }
    this.stack.pop();
    return true;
  }

  depth(): number {
    return this.stack.length;
  }

  isRootShell(): boolean {
    return this.current().isRoot;
  }

  getCurrentUser(): string {
    return this.current().user;
  }

  updateCwd(cwd: string): void {
    const current = this.current();
    current.cwd = cwd;
    current.env.set('PWD', cwd);
  }
}

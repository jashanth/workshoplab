# Kali Web VM

A professional browser-based Kali Linux environment built with React, TypeScript, and Tailwind CSS. This project provides a complete desktop experience with real backend integration capability for executing commands in isolated Kali Linux containers.

![Kali Web VM](https://img.shields.io/badge/Kali-Linux-557C94?style=flat&logo=kali-linux)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)

## ✨ Features

### 🖥️ Complete Desktop Environment
- **Boot Screen** - Realistic Linux boot sequence with system initialization logs
- **Login Screen** - Secure authentication interface with user/guest sessions
- **Desktop** - Full-featured Xfce-inspired desktop with window management
- **Top Panel** - System tray, application launcher, workspace switcher, clock
- **Dock** - Quick access to favorite applications
- **Context Menus** - Right-click desktop and application menus
- **Notifications** - System notification center

### 📦 Built-in Applications
- **XTerminal** - Professional xterm.js-based terminal with WebSocket backend support
- **Kali Tools Launcher** - Comprehensive categorized tool directory (250+ tools)
  - Information Gathering
  - Vulnerability Analysis
  - Web Application Analysis
  - Password Attacks
  - Wireless Attacks
  - Exploitation Tools
  - Sniffing & Spoofing
  - Post Exploitation
  - Forensics
  - Reverse Engineering
  - Reporting Tools
- **File Manager** - Browse virtual filesystem with persistence
- **Text Editor** - Syntax-highlighted code editor
- **Browser** - Integrated web browser interface
- **Security Lab** - Educational security tools (hash generator, Base64, URL encoding, port scanner, HTTP tester, DNS lookup)
- **System Monitor** - Real-time CPU, memory, disk, network monitoring
- **Settings** - Customize wallpaper, terminal theme, hostname, UI scale

### 🔧 Backend Integration Architecture
- **Session Management** - Create/manage isolated Kali Linux sessions
- **WebSocket Communication** - Real-time bidirectional terminal I/O
- **API Service Layer** - RESTful API for container orchestration
- **Offline Mode** - Full functionality without backend (simulated commands)
- **Connection Status** - Real-time backend connection indicators

### 💾 Virtual Filesystem
- Persistent filesystem using IndexedDB (LocalForage)
- Complete Linux directory structure
- File operations: create, read, write, delete, copy, move
- Permissions simulation
- Survives page refreshes

### 🎨 Professional UI/UX
- Dark Kali-inspired theme
- Smooth animations and transitions
- Draggable, resizable windows
- Window minimize/maximize/restore
- Multiple workspace support
- Keyboard shortcuts (Ctrl+Alt+T for terminal, Alt+Tab, PrintScreen)
- Responsive design

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd claude

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
npm run preview
```

## 🔌 Backend Integration

The application is designed to work with a real Kali Linux backend for executing commands in isolated containers.

### Running in Offline Mode (Default)

By default, the application runs in **offline mode** with a simulated filesystem and command interpreter. All UI features work without a backend.

### Connecting to a Backend

1. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

2. Configure backend endpoints:
```env
VITE_API_URL=http://localhost:3001/api
VITE_WS_HOST=localhost:3001
```

3. Implement the backend server following `BACKEND.md` specifications

4. The frontend will automatically detect the backend and switch to **online mode**

See [BACKEND.md](./BACKEND.md) for complete backend API specification and security considerations.

## 🏗️ Architecture

### Frontend Stack
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **xterm.js** - Terminal emulator
- **LocalForage** - Persistent storage

### Project Structure
```
src/
├── components/
│   ├── apps/              # Application windows
│   │   ├── XTerminal.tsx  # xterm.js terminal with WebSocket
│   │   ├── ToolsLauncher.tsx
│   │   ├── FileManager.tsx
│   │   ├── SecurityLab.tsx
│   │   └── ...
│   ├── Desktop.tsx        # Main desktop environment
│   ├── TopPanel.tsx       # System panel
│   ├── Window.tsx         # Window manager
│   └── ...
├── services/
│   ├── api.ts            # Backend API client
│   ├── websocket.ts      # WebSocket service
│   ├── session.ts        # Session manager
│   ├── commands.ts       # Command interpreter
│   ├── filesystem.ts     # Virtual filesystem
│   └── ...
├── store/
│   └── index.ts          # Zustand store
├── types/
│   └── index.ts          # TypeScript types
└── App.tsx               # Root component
```

## 🎮 Usage

### Keyboard Shortcuts
- **Ctrl+Alt+T** - Open Terminal
- **Ctrl+Shift+Esc** - Open System Monitor
- **Alt+Tab** - Cycle through windows
- **Escape** - Close menus
- **PrintScreen** - Take screenshot (simulated)

### Terminal Commands (Offline Mode)
The simulated terminal supports common Linux commands:

**Filesystem:** `ls`, `cd`, `pwd`, `mkdir`, `touch`, `cat`, `cp`, `mv`, `rm`, `head`, `tail`, `grep`, `find`, `tree`

**System:** `whoami`, `hostname`, `uname`, `date`, `uptime`, `id`, `env`, `export`, `which`, `neofetch`

**Network:** `ifconfig`, `ip`, `ping`, `curl`, `wget`, `nslookup`, `dig`, `ss`, `netstat`

**Processes:** `ps`, `top`, `kill`, `free`, `df`

**Utilities:** `echo`, `clear`, `history`, `help`, `man`, `python3`, `git`

**Shell:** `>`, `>>`, `|`, `&&`, `;`

### Kali Tools Launcher
Click the "Kali Tools" icon on the desktop to access the comprehensive tool directory. Tools are organized by category and include descriptions and manual pages.

**Note:** Tools require a live backend connection to execute. In offline mode, clicking "Launch" will show a notification indicating the backend is unavailable.

## 🔒 Security

This is an **educational project** designed for learning and demonstration purposes.

### Important Security Considerations:

1. **Never expose to public internet without proper authentication**
2. **Backend must implement container isolation** (see BACKEND.md)
3. **Use resource limits** (CPU, memory, network)
4. **Implement session timeouts** and automatic cleanup
5. **No host filesystem access** for containers
6. **No privileged mode** or Docker socket exposure
7. **Validate all inputs** on backend
8. **Rate limiting** on session creation
9. **Audit logging** for security events

## 📝 Development

### Adding New Applications

1. Create component in `src/components/apps/YourApp.tsx`
2. Register in `src/components/Window.tsx` component map
3. Add desktop icon in `src/components/Desktop.tsx`
4. Add to dock if needed in `src/components/Dock.tsx`

### Customizing Themes

Terminal themes are defined in `src/services/terminal-themes.ts`. Wallpapers can be configured in `src/services/wallpapers.ts`.

### State Management

The application uses Zustand for global state. Main store is in `src/store/index.ts` with slices for:
- Windows management
- Notifications
- Settings
- System stats
- Session state

## 🤝 Contributing

This is an educational project. Feel free to fork and customize for your own learning purposes.

## 📄 License

This project is for educational purposes only.

## ⚠️ Disclaimer

This software is provided for **educational and research purposes only**. Users are responsible for ensuring legal compliance in their jurisdiction. The authors are not liable for misuse or damage caused by this software.

## 🙏 Acknowledgments

- Kali Linux for inspiration
- xterm.js for the excellent terminal emulator
- The open-source community

---

**Default Credentials (Login Screen):**
- Username: `kali`
- Password: `kali` (or any password in offline mode)

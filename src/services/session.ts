// Session Manager - Orchestrates API and WebSocket for Kali sessions

import { apiService, type SessionInfo, type CreateSessionResponse } from './api';
import { TerminalWebSocket, type ConnectionStatus } from './websocket';

export type SessionMode = 'offline' | 'online';

export interface SessionState {
  mode: SessionMode;
  sessionInfo: SessionInfo | null;
  connectionStatus: ConnectionStatus;
  error: string | null;
}

export class SessionManager {
  private terminalWs: TerminalWebSocket | null = null;
  private sessionInfo: SessionInfo | null = null;
  private mode: SessionMode = 'offline';
  private onStateChangeCallback: ((state: SessionState) => void) | null = null;

  async initialize(): Promise<SessionMode> {
    // Try to connect to backend
    try {
      const response = await this.createSession();
      this.mode = 'online';
      this.sessionInfo = {
        id: response.sessionId,
        status: 'running',
        createdAt: Date.now(),
        lastActivity: Date.now(),
      };

      // Initialize WebSocket
      const wsUrl = response.websocketUrl || this.getWebSocketUrl(response.sessionId);
      this.terminalWs = new TerminalWebSocket(wsUrl);

      this.terminalWs.onStatus(() => {
        this.notifyStateChange();
      });

      this.notifyStateChange();
      return 'online';
    } catch (error) {
      console.warn('[SessionManager] Backend unavailable, running in offline mode:', error);
      this.mode = 'offline';
      this.notifyStateChange();
      return 'offline';
    }
  }

  async createSession(): Promise<CreateSessionResponse> {
    return await apiService.createSession({
      image: 'kalilinux/kali-rolling:latest',
      resourceLimits: {
        cpuLimit: 2,
        memoryLimit: 2048,
      },
    });
  }

  async connectTerminal(): Promise<void> {
    if (this.terminalWs && this.mode === 'online') {
      await this.terminalWs.connect();
      this.notifyStateChange();
    } else {
      throw new Error('Cannot connect terminal in offline mode');
    }
  }

  getTerminalWebSocket(): TerminalWebSocket | null {
    return this.terminalWs;
  }

  getSessionInfo(): SessionInfo | null {
    return this.sessionInfo;
  }

  getMode(): SessionMode {
    return this.mode;
  }

  getConnectionStatus(): ConnectionStatus {
    if (this.mode === 'offline') {
      return 'disconnected';
    }
    return this.terminalWs?.getStatus() || 'disconnected';
  }

  async cleanup(): Promise<void> {
    if (this.terminalWs) {
      this.terminalWs.disconnect();
      this.terminalWs = null;
    }

    if (this.sessionInfo && this.mode === 'online') {
      try {
        await apiService.deleteSession(this.sessionInfo.id);
      } catch (error) {
        console.error('[SessionManager] Failed to delete session:', error);
      }
    }

    this.sessionInfo = null;
    this.notifyStateChange();
  }

  onStateChange(callback: (state: SessionState) => void): void {
    this.onStateChangeCallback = callback;
  }

  getState(): SessionState {
    return {
      mode: this.mode,
      sessionInfo: this.sessionInfo,
      connectionStatus: this.getConnectionStatus(),
      error: null,
    };
  }

  private getWebSocketUrl(sessionId: string): string {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = import.meta.env.VITE_WS_HOST || 'localhost:3001';
    return `${wsProtocol}//${host}/api/sessions/${sessionId}/terminal`;
  }

  private notifyStateChange(): void {
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback(this.getState());
    }
  }
}

export const sessionManager = new SessionManager();

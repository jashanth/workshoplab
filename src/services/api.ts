// API Service for backend communication
// This provides the abstraction layer for session management

export interface SessionInfo {
  id: string;
  status: 'starting' | 'running' | 'stopped' | 'error';
  containerId?: string;
  createdAt: number;
  lastActivity: number;
  ipAddress?: string;
  resources?: {
    cpu: number;
    memory: number;
    disk: number;
  };
}

export interface CreateSessionRequest {
  image?: string;
  resourceLimits?: {
    cpuLimit?: number;
    memoryLimit?: number;
  };
}

export interface CreateSessionResponse {
  sessionId: string;
  status: string;
  websocketUrl: string;
}

class ApiService {
  private baseUrl: string;
  private sessionId: string | null = null;

  constructor() {
    // Use environment variable or default to localhost
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
  }

  async createSession(request?: CreateSessionRequest): Promise<CreateSessionResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request || {}),
      });

      if (!response.ok) {
        throw new Error(`Failed to create session: ${response.statusText}`);
      }

      const data = await response.json();
      this.sessionId = data.sessionId;
      return data;
    } catch (error) {
      console.error('Failed to create session:', error);
      throw new Error('Backend unavailable. Running in offline mode.');
    }
  }

  async getSession(sessionId: string): Promise<SessionInfo> {
    try {
      const response = await fetch(`${this.baseUrl}/sessions/${sessionId}`);

      if (!response.ok) {
        throw new Error(`Failed to get session: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get session:', error);
      throw error;
    }
  }

  async deleteSession(sessionId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/sessions/${sessionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete session: ${response.statusText}`);
      }

      if (this.sessionId === sessionId) {
        this.sessionId = null;
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
      throw error;
    }
  }

  async listSessions(): Promise<SessionInfo[]> {
    try {
      const response = await fetch(`${this.baseUrl}/sessions`);

      if (!response.ok) {
        throw new Error(`Failed to list sessions: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to list sessions:', error);
      return [];
    }
  }

  getCurrentSessionId(): string | null {
    return this.sessionId;
  }

  isBackendAvailable(): boolean {
    // This will be checked during initialization
    return false;
  }
}

export const apiService = new ApiService();

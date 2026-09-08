// WebSocket Service for terminal communication
// This handles bidirectional communication with the backend shell

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface TerminalData {
  data: string;
}

export interface WebSocketMessage {
  type: 'data' | 'resize' | 'ping' | 'pong';
  payload?: unknown;
}

export class TerminalWebSocket {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private onDataCallback: ((data: string) => void) | null = null;
  private onStatusCallback: ((status: ConnectionStatus) => void) | null = null;
  private status: ConnectionStatus = 'disconnected';

  constructor(url: string) {
    this.url = url;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.setStatus('connecting');
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('[WebSocket] Connected to terminal');
          this.setStatus('connected');
          this.reconnectAttempts = 0;
          this.startPing();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data) as WebSocketMessage;

            if (message.type === 'data' && this.onDataCallback) {
              this.onDataCallback((message.payload as TerminalData).data);
            } else if (message.type === 'pong') {
              // Keep-alive response
            }
          } catch {
            // Plain text message
            if (this.onDataCallback) {
              this.onDataCallback(event.data);
            }
          }
        };

        this.ws.onerror = (error) => {
          console.error('[WebSocket] Error:', error);
          this.setStatus('error');
          reject(new Error('WebSocket connection failed'));
        };

        this.ws.onclose = () => {
          console.log('[WebSocket] Connection closed');
          this.setStatus('disconnected');
          this.stopPing();
          this.attemptReconnect();
        };
      } catch (error) {
        this.setStatus('error');
        reject(error);
      }
    });
  }

  send(data: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage = {
        type: 'data',
        payload: { data },
      };
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('[WebSocket] Cannot send data: not connected');
    }
  }

  resize(cols: number, rows: number): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage = {
        type: 'resize',
        payload: { cols, rows },
      };
      this.ws.send(JSON.stringify(message));
    }
  }

  disconnect(): void {
    this.reconnectAttempts = this.maxReconnectAttempts; // Prevent reconnection
    this.stopPing();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.setStatus('disconnected');
  }

  onData(callback: (data: string) => void): void {
    this.onDataCallback = callback;
  }

  onStatus(callback: (status: ConnectionStatus) => void): void {
    this.onStatusCallback = callback;
  }

  getStatus(): ConnectionStatus {
    return this.status;
  }

  isConnected(): boolean {
    return this.status === 'connected' && this.ws?.readyState === WebSocket.OPEN;
  }

  private setStatus(status: ConnectionStatus): void {
    this.status = status;
    if (this.onStatusCallback) {
      this.onStatusCallback(status);
    }
  }

  private startPing(): void {
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        const message: WebSocketMessage = { type: 'ping' };
        this.ws.send(JSON.stringify(message));
      }
    }, 30000); // Ping every 30 seconds
  }

  private stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`[WebSocket] Reconnecting... Attempt ${this.reconnectAttempts}`);
      setTimeout(() => {
        this.connect().catch(() => {
          // Reconnection failed, will try again
        });
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.log('[WebSocket] Max reconnection attempts reached');
      this.setStatus('error');
    }
  }
}

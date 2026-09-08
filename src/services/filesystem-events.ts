// Filesystem Event System
// Provides notifications when filesystem changes occur

type FilesystemEventType = 'create' | 'update' | 'delete' | 'rename';

interface FilesystemEvent {
  type: FilesystemEventType;
  path: string;
  timestamp: number;
}

type FilesystemListener = (event: FilesystemEvent) => void;

class FilesystemEventEmitter {
  private listeners: Set<FilesystemListener> = new Set();

  subscribe(listener: FilesystemListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(type: FilesystemEventType, path: string): void {
    const event: FilesystemEvent = {
      type,
      path,
      timestamp: Date.now(),
    };
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('[FilesystemEventEmitter] Listener error:', error);
      }
    });
  }

  clear(): void {
    this.listeners.clear();
  }
}

export const filesystemEvents = new FilesystemEventEmitter();

import { VirtualFileSystem } from '../services/filesystem';
import { filesystemEvents } from '../services/filesystem-events';

let fsInstance: VirtualFileSystem | null = null;

export function getFileSystem(): VirtualFileSystem {
  if (!fsInstance) {
    const saved = localStorage.getItem('kali-vm-fs');
    fsInstance = new VirtualFileSystem();
    if (saved) {
      try {
        fsInstance.deserialize(saved);
      } catch (e) {
        console.error('Failed to load filesystem:', e);
        fsInstance = new VirtualFileSystem();
      }
    }
  }
  return fsInstance;
}

export function saveFileSystem(eventType?: 'create' | 'update' | 'delete' | 'rename', path?: string): void {
  if (fsInstance) {
    try {
      localStorage.setItem('kali-vm-fs', fsInstance.serialize());
      // Emit event to notify all listeners
      if (eventType && path) {
        filesystemEvents.emit(eventType, path);
      }
    } catch (e) {
      console.error('Failed to save filesystem:', e);
    }
  }
}

export function resetFileSystem(): void {
  localStorage.removeItem('kali-vm-fs');
  fsInstance = new VirtualFileSystem();
  filesystemEvents.emit('update', '/');
}

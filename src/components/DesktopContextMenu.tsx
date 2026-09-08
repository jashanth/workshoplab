import { useStore } from '../store';
import { getFileSystem, saveFileSystem } from '../store/filesystem-store';

export default function DesktopContextMenu() {
  const contextMenu = useStore((s) => s.contextMenu);
  const hideContextMenu = useStore((s) => s.hideContextMenu);
  const openWindow = useStore((s) => s.openWindow);
  const activeWorkspace = useStore((s) => s.activeWorkspace);
  const addNotification = useStore((s) => s.addNotification);

  if (!contextMenu) return null;

  const handleNewFolder = () => {
    try {
      const fs = getFileSystem();
      const desktopPath = '/home/kali/Desktop';
      let folderName = 'New Folder';
      let counter = 1;

      while (fs.exists(`${desktopPath}/${folderName}`)) {
        folderName = `New Folder (${counter++})`;
      }

      const fullPath = `${desktopPath}/${folderName}`;
      fs.mkdir(fullPath);
      saveFileSystem('create', fullPath);
      addNotification({
        title: 'File System',
        message: `Created folder "${folderName}" on Desktop`,
        type: 'success',
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      addNotification({
        title: 'Error',
        message: errorMsg,
        type: 'error',
      });
    }
    hideContextMenu();
  };

  const handleNewFile = () => {
    try {
      const fs = getFileSystem();
      const desktopPath = '/home/kali/Desktop';
      let fileName = 'New Text File.txt';
      let counter = 1;

      while (fs.exists(`${desktopPath}/${fileName}`)) {
        fileName = `New Text File (${counter++}).txt`;
      }

      const fullPath = `${desktopPath}/${fileName}`;
      fs.touch(fullPath, '');
      saveFileSystem('create', fullPath);
      addNotification({
        title: 'File System',
        message: `Created file "${fileName}" on Desktop`,
        type: 'success',
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      addNotification({
        title: 'Error',
        message: errorMsg,
        type: 'error',
      });
    }
    hideContextMenu();
  };

  const handleOpenTerminal = () => {
    openWindow({
      title: 'Terminal',
      icon: '💻',
      component: 'Terminal',
      x: 100,
      y: 80,
      width: 800,
      height: 500,
      minWidth: 400,
      minHeight: 300,
      workspace: activeWorkspace,
    });
    hideContextMenu();
  };

  const handleOpenSettings = () => {
    openWindow({
      title: 'Settings',
      icon: '⚙️',
      component: 'Settings',
      x: 120,
      y: 90,
      width: 700,
      height: 500,
      minWidth: 500,
      minHeight: 400,
      workspace: activeWorkspace,
    });
    hideContextMenu();
  };

  return (
    <>
      <div className="fixed inset-0 z-50" onClick={hideContextMenu} />
      <div
        className="fixed z-50 bg-kali-panel border border-kali-border rounded-lg shadow-2xl py-1 text-xs text-kali-text min-w-[180px]"
        style={{ top: contextMenu.y, left: contextMenu.x }}
      >
        <button
          onClick={handleNewFolder}
          className="w-full px-3 py-1.5 hover:bg-white/10 text-left flex items-center gap-2 transition-colors"
        >
          <span>📁</span>
          <span>New Folder</span>
        </button>
        <button
          onClick={handleNewFile}
          className="w-full px-3 py-1.5 hover:bg-white/10 text-left flex items-center gap-2 transition-colors"
        >
          <span>📄</span>
          <span>New Text File</span>
        </button>

        <div className="h-px bg-kali-border my-1" />

        <button
          onClick={handleOpenTerminal}
          className="w-full px-3 py-1.5 hover:bg-white/10 text-left flex items-center gap-2 transition-colors"
        >
          <span>💻</span>
          <span>Open Terminal Here</span>
        </button>

        <div className="h-px bg-kali-border my-1" />

        <button
          onClick={handleOpenSettings}
          className="w-full px-3 py-1.5 hover:bg-white/10 text-left flex items-center gap-2 transition-colors"
        >
          <span>⚙️</span>
          <span>Desktop Settings</span>
        </button>
      </div>
    </>
  );
}

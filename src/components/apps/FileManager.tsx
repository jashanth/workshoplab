import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../store';
import { getFileSystem, saveFileSystem } from '../../store/filesystem-store';
import { filesystemEvents } from '../../services/filesystem-events';
import type { FSNode } from '../../types';

interface FileManagerProps {
  initialPath?: string;
}

export const FileManager: React.FC<FileManagerProps> = ({ initialPath = '/home/kali' }) => {
  const [currentPath, setCurrentPath] = useState<string>(initialPath);
  const [history, setHistory] = useState<string[]>([initialPath]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'size' | 'date'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [items, setItems] = useState<FSNode[]>([]);

  // Modals & prompts
  const [promptModal, setPromptModal] = useState<{
    isOpen: boolean;
    type: 'newFolder' | 'newFile' | 'rename' | 'delete';
    targetName?: string;
    value: string;
  }>({ isOpen: false, type: 'newFolder', value: '' });

  // Context Menu for right click on item or blank area
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    target?: FSNode;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const fsRef = useRef(getFileSystem());
  const openWindow = useStore((state) => state.openWindow);
  const addNotification = useStore((state) => state.addNotification);

  const loadDirectory = (path: string) => {
    try {
      const resolved = fsRef.current.resolve(path);
      const detailed = fsRef.current.lsDetailed(resolved);
      setItems(detailed);
      setSelectedItems([]);
    } catch (e: any) {
      addNotification({
        title: 'File Manager Error',
        message: e?.message || 'Failed to read directory',
        type: 'error',
      });
      setItems([]);
      setSelectedItems([]);

      // If the open directory was removed externally, return to its parent.
      const parentPath = fsRef.current.resolve(`${path}/..`);
      if (parentPath !== path && fsRef.current.isDirectory(parentPath)) {
        setCurrentPath(parentPath);
        setHistory([parentPath]);
        setHistoryIndex(0);
      }
    }
  };

  useEffect(() => {
    loadDirectory(currentPath);
  }, [currentPath]);

  // Subscribe to filesystem changes to reload if current dir affected
  useEffect(() => {
    const unsubscribe = filesystemEvents.subscribe((event) => {
      if (event.path === currentPath || event.path.startsWith(currentPath + '/') || currentPath.startsWith(event.path)) {
        loadDirectory(currentPath);
      }
    });
    return unsubscribe;
  }, [currentPath]);

  const navigateTo = (newPath: string) => {
    try {
      const resolved = fsRef.current.resolve(newPath);
      if (!fsRef.current.isDirectory(resolved)) {
        throw new Error(`ls: cannot access '${resolved}': No such file or directory`);
      }

      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(resolved);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      setCurrentPath(resolved);
    } catch (e: any) {
      addNotification({
        title: 'Navigation Error',
        message: e?.message || 'Cannot navigate to path',
        type: 'error',
      });
    }
  };

  const goBack = () => {
    if (historyIndex > 0) {
      const newIdx = historyIndex - 1;
      setHistoryIndex(newIdx);
      setCurrentPath(history[newIdx]);
    }
  };

  const goForward = () => {
    if (historyIndex < history.length - 1) {
      const newIdx = historyIndex + 1;
      setHistoryIndex(newIdx);
      setCurrentPath(history[newIdx]);
    }
  };

  const goUp = () => {
    const parentPath = fsRef.current.resolve(currentPath + '/..');
    navigateTo(parentPath);
  };

  const handleItemDoubleClick = (item: FSNode) => {
    const itemFullPath = fsRef.current.resolve(`${currentPath}/${item.name}`);
    if (!fsRef.current.exists(itemFullPath)) {
      loadDirectory(currentPath);
      addNotification({
        title: 'File Manager Error',
        message: `The item '${item.name}' no longer exists.`,
        type: 'error',
      });
      return;
    }

    if (item.type === 'directory') {
      navigateTo(itemFullPath);
    } else {
      // Open in text editor
      openWindow({
        title: `Text Editor - ${item.name}`,
        icon: '📝',
        component: 'TextEditor',
        x: 100 + Math.random() * 50,
        y: 80 + Math.random() * 50,
        width: 700,
        height: 500,
        minWidth: 400,
        minHeight: 300,
        workspace: 1,
        props: { initialPath: itemFullPath },
      });
    }
  };

  const handleItemClick = (e: React.MouseEvent, item: FSNode) => {
    e.stopPropagation();
    if (e.ctrlKey || e.metaKey) {
      if (selectedItems.includes(item.name)) {
        setSelectedItems(selectedItems.filter((name) => name !== item.name));
      } else {
        setSelectedItems([...selectedItems, item.name]);
      }
    } else {
      setSelectedItems([item.name]);
    }
  };

  const handleCreateFolder = () => {
    if (!promptModal.value.trim()) return;
    try {
      const target = `${currentPath}/${promptModal.value.trim()}`;
      fsRef.current.mkdir(target);
      saveFileSystem();
      loadDirectory(currentPath);
      addNotification({
        title: 'Folder Created',
        message: `Created directory '${promptModal.value}'`,
        type: 'success',
      });
    } catch (e: any) {
      addNotification({
        title: 'Error Creating Folder',
        message: e?.message || 'Failed to create folder',
        type: 'error',
      });
    }
    setPromptModal({ isOpen: false, type: 'newFolder', value: '' });
  };

  const handleCreateFile = () => {
    if (!promptModal.value.trim()) return;
    try {
      const target = `${currentPath}/${promptModal.value.trim()}`;
      fsRef.current.touch(target);
      saveFileSystem();
      loadDirectory(currentPath);
      addNotification({
        title: 'File Created',
        message: `Created file '${promptModal.value}'`,
        type: 'success',
      });
    } catch (e: any) {
      addNotification({
        title: 'Error Creating File',
        message: e?.message || 'Failed to create file',
        type: 'error',
      });
    }
    setPromptModal({ isOpen: false, type: 'newFile', value: '' });
  };

  const handleRename = () => {
    if (!promptModal.value.trim() || !promptModal.targetName) return;
    try {
      const src = `${currentPath}/${promptModal.targetName}`;
      const dest = `${currentPath}/${promptModal.value.trim()}`;
      fsRef.current.mv(src, dest);
      saveFileSystem();
      loadDirectory(currentPath);
      addNotification({
        title: 'Item Renamed',
        message: `Renamed '${promptModal.targetName}' to '${promptModal.value}'`,
        type: 'success',
      });
    } catch (e: any) {
      addNotification({
        title: 'Error Renaming',
        message: e?.message || 'Failed to rename item',
        type: 'error',
      });
    }
    setPromptModal({ isOpen: false, type: 'rename', value: '' });
  };

  const handleDelete = () => {
    if (!promptModal.targetName) return;
    try {
      const target = `${currentPath}/${promptModal.targetName}`;
      const isDir = fsRef.current.isDirectory(target);
      fsRef.current.rm(target, isDir);
      saveFileSystem();
      loadDirectory(currentPath);
      addNotification({
        title: 'Deleted',
        message: `Deleted '${promptModal.targetName}'`,
        type: 'info',
      });
    } catch (e: any) {
      addNotification({
        title: 'Error Deleting',
        message: e?.message || 'Failed to delete item',
        type: 'error',
      });
    }
    setPromptModal({ isOpen: false, type: 'delete', value: '' });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const filePath = `${currentPath}/${file.name}`;
        fsRef.current.writeFile(filePath, content || '');
        saveFileSystem();
        loadDirectory(currentPath);
        addNotification({
          title: 'File Uploaded',
          message: `Saved ${file.name} to ${currentPath}`,
          type: 'success',
        });
      } catch (err: any) {
        addNotification({
          title: 'Upload Error',
          message: err?.message || 'Failed to upload file',
          type: 'error',
        });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDownloadFile = (fileName: string) => {
    try {
      const filePath = `${currentPath}/${fileName}`;
      const content = fsRef.current.readFile(filePath);
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      addNotification({
        title: 'Download Error',
        message: e?.message || 'Failed to download file',
        type: 'error',
      });
    }
  };

  const getFileIcon = (item: FSNode) => {
    if (item.type === 'directory') {
      return (
        <span className="text-blue-400 text-2xl" role="img" aria-label="folder">
          📁
        </span>
      );
    }
    const name = item.name.toLowerCase();
    if (name.endsWith('.py')) return <span className="text-yellow-400 text-2xl">🐍</span>;
    if (name.endsWith('.sh') || name.endsWith('.bash')) return <span className="text-green-400 text-2xl">⚡</span>;
    if (name.endsWith('.txt') || name.endsWith('.md')) return <span className="text-gray-300 text-2xl">📄</span>;
    if (name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.svg')) return <span className="text-pink-400 text-2xl">🖼️</span>;
    if (name.endsWith('.json') || name.endsWith('.conf') || name.endsWith('.cfg')) return <span className="text-orange-400 text-2xl">⚙️</span>;
    if (name.endsWith('.log')) return <span className="text-cyan-400 text-2xl">📜</span>;
    if (item.permissions.includes('x')) return <span className="text-green-500 text-2xl">🚀</span>;
    return <span className="text-gray-400 text-2xl">📄</span>;
  };

  const sortedItems = [...items].sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === 'directory' ? -1 : 1;
    }
    let res = 0;
    if (sortBy === 'name') {
      res = a.name.localeCompare(b.name);
    } else if (sortBy === 'size') {
      res = a.size - b.size;
    } else if (sortBy === 'date') {
      res = new Date(a.modified).getTime() - new Date(b.modified).getTime();
    }
    return sortOrder === 'asc' ? res : -res;
  });

  const pathParts = currentPath.split('/').filter(Boolean);

  const quickLinks = [
    { label: 'Home', path: '/home/kali', icon: '🏠' },
    { label: 'Desktop', path: '/home/kali/Desktop', icon: '🖥️' },
    { label: 'Documents', path: '/home/kali/Documents', icon: '📁' },
    { label: 'Downloads', path: '/home/kali/Downloads', icon: '📥' },
    { label: 'Music', path: '/home/kali/Music', icon: '🎵' },
    { label: 'Pictures', path: '/home/kali/Pictures', icon: '🖼️' },
    { label: 'Videos', path: '/home/kali/Videos', icon: '🎬' },
    { label: 'File System (/)', path: '/', icon: '💾' },
    { label: 'Logs (/var/log)', path: '/var/log', icon: '📜' },
  ];

  return (
    <div
      className="flex flex-col h-full bg-[#121624] text-gray-200 select-none text-sm font-sans"
      onClick={() => {
        setSelectedItems([]);
        setContextMenu(null);
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY });
      }}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#181e32] border-b border-[#2d3752] gap-2 flex-wrap">
        <div className="flex items-center gap-1">
          <button
            onClick={goBack}
            disabled={historyIndex <= 0}
            className="p-1.5 rounded hover:bg-[#283250] disabled:opacity-30 disabled:hover:bg-transparent"
            title="Back"
          >
            ◀
          </button>
          <button
            onClick={goForward}
            disabled={historyIndex >= history.length - 1}
            className="p-1.5 rounded hover:bg-[#283250] disabled:opacity-30 disabled:hover:bg-transparent"
            title="Forward"
          >
            ▶
          </button>
          <button
            onClick={goUp}
            disabled={currentPath === '/'}
            className="p-1.5 rounded hover:bg-[#283250] disabled:opacity-30 disabled:hover:bg-transparent"
            title="Parent Directory"
          >
            ▲
          </button>
          <button
            onClick={() => navigateTo('/home/kali')}
            className="p-1.5 rounded hover:bg-[#283250]"
            title="Home"
          >
            🏠
          </button>
          <button
            onClick={() => loadDirectory(currentPath)}
            className="p-1.5 rounded hover:bg-[#283250]"
            title="Refresh"
          >
            🔄
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setPromptModal({ isOpen: true, type: 'newFolder', value: '' })}
            className="px-2.5 py-1 text-xs bg-[#242e4c] hover:bg-[#324068] text-gray-200 rounded border border-[#394970] flex items-center gap-1"
          >
            <span>📁+</span> New Folder
          </button>
          <button
            onClick={() => setPromptModal({ isOpen: true, type: 'newFile', value: '' })}
            className="px-2.5 py-1 text-xs bg-[#242e4c] hover:bg-[#324068] text-gray-200 rounded border border-[#394970] flex items-center gap-1"
          >
            <span>📄+</span> New File
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-2.5 py-1 text-xs bg-[#242e4c] hover:bg-[#324068] text-gray-200 rounded border border-[#394970] flex items-center gap-1"
            title="Upload file into current directory"
          >
            <span>⬆</span> Upload
          </button>
          {selectedItems.length === 1 && (
            <button
              onClick={() => handleDownloadFile(selectedItems[0])}
              className="px-2.5 py-1 text-xs bg-[#242e4c] hover:bg-[#324068] text-gray-200 rounded border border-[#394970] flex items-center gap-1"
              title="Download selected file"
            >
              <span>⬇</span> Download
            </button>
          )}
        </div>

        {/* View toggles & sorting */}
        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-[#121624] text-xs border border-[#394970] rounded px-2 py-1 outline-none"
          >
            <option value="name">Sort: Name</option>
            <option value="size">Sort: Size</option>
            <option value="date">Sort: Date</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="p-1 rounded bg-[#121624] border border-[#394970] hover:bg-[#283250] text-xs px-2"
          >
            {sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
          </button>
          <div className="flex border border-[#394970] rounded overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-2 py-1 text-xs ${viewMode === 'grid' ? 'bg-[#367bf0] text-white' : 'bg-[#121624] text-gray-300'}`}
              title="Grid View"
            >
              ⊞
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-2 py-1 text-xs ${viewMode === 'list' ? 'bg-[#367bf0] text-white' : 'bg-[#121624] text-gray-300'}`}
              title="List View"
            >
              ☰
            </button>
          </div>
        </div>
      </div>

      {/* Path Breadcrumb Bar */}
      <div className="flex items-center px-3 py-1.5 bg-[#14192b] border-b border-[#252e46] text-xs overflow-x-auto gap-1">
        <span className="text-gray-400">Location:</span>
        <button
          onClick={() => navigateTo('/')}
          className="px-1.5 py-0.5 rounded hover:bg-[#252e46] font-mono text-blue-400"
        >
          /
        </button>
        {pathParts.map((part, index) => {
          const subPath = '/' + pathParts.slice(0, index + 1).join('/');
          return (
            <React.Fragment key={subPath}>
              <span className="text-gray-500">/</span>
              <button
                onClick={() => navigateTo(subPath)}
                className={`px-1.5 py-0.5 rounded hover:bg-[#252e46] font-mono ${
                  index === pathParts.length - 1 ? 'text-white font-semibold' : 'text-blue-300'
                }`}
              >
                {part}
              </button>
            </React.Fragment>
          );
        })}
      </div>

      {/* Main Workspace (Sidebar + Files view) */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-44 bg-[#14192b] border-r border-[#252e46] p-2 flex flex-col gap-1 overflow-y-auto shrink-0">
          <div className="text-[10px] font-semibold tracking-wider uppercase text-gray-400 px-2 py-1">
            Places
          </div>
          {quickLinks.map((link) => {
            const isActive = currentPath === link.path;
            return (
              <button
                key={link.path}
                onClick={() => navigateTo(link.path)}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded text-left text-xs transition-colors ${
                  isActive
                    ? 'bg-[#367bf0]/20 text-[#00d9ff] font-medium border border-[#367bf0]/40'
                    : 'text-gray-300 hover:bg-[#1f2742]'
                }`}
              >
                <span>{link.icon}</span>
                <span className="truncate">{link.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 p-3 overflow-y-auto bg-[#0e1220]">
          {sortedItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-2">
              <span className="text-4xl">📂</span>
              <span>This folder is empty</span>
            </div>
          ) : viewMode === 'grid' ? (
            /* Grid View */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {sortedItems.map((item) => {
                const isSelected = selectedItems.includes(item.name);
                return (
                  <div
                    key={item.name}
                    onClick={(e) => handleItemClick(e, item)}
                    onDoubleClick={() => handleItemDoubleClick(item)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedItems([item.name]);
                      setContextMenu({ x: e.clientX, y: e.clientY, target: item });
                    }}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#367bf0]/20 border-[#367bf0] shadow-md'
                        : 'bg-[#14192b]/60 border-transparent hover:bg-[#1a2138] hover:border-[#2a3556]'
                    }`}
                  >
                    <div className="mb-1">{getFileIcon(item)}</div>
                    <span
                      className="text-xs text-gray-200 truncate w-full px-1"
                      title={item.name}
                    >
                      {item.name}
                    </span>
                    <span className="text-[10px] text-gray-500 mt-0.5 font-mono">
                      {item.type === 'directory' ? 'folder' : `${item.size} B`}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            /* List View */
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="text-gray-400 border-b border-[#252e46] pb-1">
                  <th className="py-1 px-2 font-medium">Name</th>
                  <th className="py-1 px-2 font-medium w-24">Size</th>
                  <th className="py-1 px-2 font-medium w-28">Permissions</th>
                  <th className="py-1 px-2 font-medium w-24">Owner</th>
                  <th className="py-1 px-2 font-medium w-36">Modified</th>
                </tr>
              </thead>
              <tbody>
                {sortedItems.map((item) => {
                  const isSelected = selectedItems.includes(item.name);
                  return (
                    <tr
                      key={item.name}
                      onClick={(e) => handleItemClick(e, item)}
                      onDoubleClick={() => handleItemDoubleClick(item)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedItems([item.name]);
                        setContextMenu({ x: e.clientX, y: e.clientY, target: item });
                      }}
                      className={`cursor-pointer border-b border-[#182036] transition-colors ${
                        isSelected
                          ? 'bg-[#367bf0]/25 text-white font-medium'
                          : 'hover:bg-[#161c30] text-gray-300'
                      }`}
                    >
                      <td className="py-1.5 px-2 flex items-center gap-2">
                        <span className="text-base">{item.type === 'directory' ? '📁' : '📄'}</span>
                        <span className="truncate max-w-xs">{item.name}</span>
                      </td>
                      <td className="py-1.5 px-2 font-mono text-gray-400">
                        {item.type === 'directory' ? '4.0 KB' : `${item.size} B`}
                      </td>
                      <td className="py-1.5 px-2 font-mono text-gray-400">
                        {item.permissions}
                      </td>
                      <td className="py-1.5 px-2 text-gray-400">{item.owner}</td>
                      <td className="py-1.5 px-2 text-gray-500 text-[11px]">
                        {new Date(item.modified).toLocaleDateString()}{' '}
                        {new Date(item.modified).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-3 py-1 bg-[#14192b] border-t border-[#252e46] text-[11px] text-gray-400">
        <div>
          {items.length} item{items.length !== 1 ? 's' : ''}{' '}
          {selectedItems.length > 0 && `(${selectedItems.length} selected)`}
        </div>
        <div className="font-mono">{currentPath}</div>
      </div>

      {/* Modal Dialogs */}
      {promptModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a2138] border border-[#394970] rounded-lg shadow-xl p-4 w-80 max-w-full text-gray-200">
            <h3 className="text-sm font-semibold mb-2">
              {promptModal.type === 'newFolder' && 'Create New Folder'}
              {promptModal.type === 'newFile' && 'Create New File'}
              {promptModal.type === 'rename' && `Rename '${promptModal.targetName}'`}
              {promptModal.type === 'delete' && 'Confirm Deletion'}
            </h3>

            {promptModal.type === 'delete' ? (
              <p className="text-xs text-gray-300 mb-4">
                Are you sure you want to delete <span className="text-red-400 font-mono">'{promptModal.targetName}'</span>? This cannot be undone.
              </p>
            ) : (
              <input
                type="text"
                autoFocus
                value={promptModal.value}
                onChange={(e) => setPromptModal({ ...promptModal, value: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (promptModal.type === 'newFolder') handleCreateFolder();
                    if (promptModal.type === 'newFile') handleCreateFile();
                    if (promptModal.type === 'rename') handleRename();
                  } else if (e.key === 'Escape') {
                    setPromptModal({ ...promptModal, isOpen: false });
                  }
                }}
                placeholder={
                  promptModal.type === 'newFolder'
                    ? 'folder_name'
                    : promptModal.type === 'newFile'
                    ? 'file.txt'
                    : 'new_name'
                }
                className="w-full bg-[#121624] border border-[#394970] rounded px-3 py-1.5 text-xs text-white outline-none focus:border-[#367bf0] mb-4"
              />
            )}

            <div className="flex justify-end gap-2 text-xs">
              <button
                onClick={() => setPromptModal({ ...promptModal, isOpen: false })}
                className="px-3 py-1.5 rounded bg-[#242e4c] hover:bg-[#2f3d64] text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (promptModal.type === 'newFolder') handleCreateFolder();
                  if (promptModal.type === 'newFile') handleCreateFile();
                  if (promptModal.type === 'rename') handleRename();
                  if (promptModal.type === 'delete') handleDelete();
                }}
                className={`px-3 py-1.5 rounded text-white font-medium ${
                  promptModal.type === 'delete'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-[#367bf0] hover:bg-[#2d66c9]'
                }`}
              >
                {promptModal.type === 'delete' ? 'Delete' : 'Apply'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <div
          style={{ top: contextMenu.y, left: contextMenu.x }}
          className="fixed bg-[#1a2138] border border-[#394970] shadow-2xl rounded py-1 z-50 text-xs w-44 text-gray-200"
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.target ? (
            <>
              <button
                onClick={() => {
                  handleItemDoubleClick(contextMenu.target!);
                  setContextMenu(null);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-[#367bf0] hover:text-white flex items-center gap-2"
              >
                <span>📂</span> Open
              </button>
              <button
                onClick={() => {
                  setPromptModal({
                    isOpen: true,
                    type: 'rename',
                    targetName: contextMenu.target!.name,
                    value: contextMenu.target!.name,
                  });
                  setContextMenu(null);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-[#367bf0] hover:text-white flex items-center gap-2"
              >
                <span>✏️</span> Rename
              </button>
              {contextMenu.target.type === 'file' && (
                <button
                  onClick={() => {
                    handleDownloadFile(contextMenu.target!.name);
                    setContextMenu(null);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#367bf0] hover:text-white flex items-center gap-2"
                >
                  <span>⬇️</span> Download
                </button>
              )}
              <div className="border-t border-[#2d3752] my-1"></div>
              <button
                onClick={() => {
                  setPromptModal({
                    isOpen: true,
                    type: 'delete',
                    targetName: contextMenu.target!.name,
                    value: '',
                  });
                  setContextMenu(null);
                }}
                className="w-full text-left px-3 py-1.5 text-red-400 hover:bg-red-600 hover:text-white flex items-center gap-2"
              >
                <span>🗑️</span> Delete
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  setPromptModal({ isOpen: true, type: 'newFolder', value: '' });
                  setContextMenu(null);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-[#367bf0] hover:text-white flex items-center gap-2"
              >
                <span>📁</span> New Folder
              </button>
              <button
                onClick={() => {
                  setPromptModal({ isOpen: true, type: 'newFile', value: '' });
                  setContextMenu(null);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-[#367bf0] hover:text-white flex items-center gap-2"
              >
                <span>📄</span> New Text File
              </button>
              <button
                onClick={() => {
                  fileInputRef.current?.click();
                  setContextMenu(null);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-[#367bf0] hover:text-white flex items-center gap-2"
              >
                <span>⬆️</span> Upload File
              </button>
              <div className="border-t border-[#2d3752] my-1"></div>
              <button
                onClick={() => {
                  loadDirectory(currentPath);
                  setContextMenu(null);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-[#367bf0] hover:text-white flex items-center gap-2"
              >
                <span>🔄</span> Refresh
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default FileManager;

import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../store';
import { getFileSystem, saveFileSystem } from '../../store/filesystem-store';

interface TextEditorProps {
  initialPath?: string;
  content?: string;
}

export const TextEditor: React.FC<TextEditorProps> = ({ initialPath, content: initialContent }) => {
  const [filePath, setFilePath] = useState<string>(initialPath || '/home/kali/Documents/untitled.txt');
  const [content, setContent] = useState<string>(initialContent || '');
  const [savedContent, setSavedContent] = useState<string>(initialContent || '');
  const [cursorPos, setCursorPos] = useState<{ line: number; col: number }>({ line: 1, col: 1 });

  // Modals
  const [saveAsModalOpen, setSaveAsModalOpen] = useState(false);
  const [saveAsPath, setSaveAsPath] = useState(filePath);
  const [openFileModalOpen, setOpenFileModalOpen] = useState(false);
  const [openFilePath, setOpenFilePath] = useState('/home/kali/');
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  const fs = getFileSystem();
  const addNotification = useStore((state) => state.addNotification);

  const isDirty = content !== savedContent;

  useEffect(() => {
    if (initialPath) {
      try {
        if (fs.exists(initialPath)) {
          const fileData = fs.readFile(initialPath);
          setContent(fileData);
          setSavedContent(fileData);
          setFilePath(initialPath);
        } else {
          setContent('');
          setSavedContent('');
          setFilePath(initialPath);
        }
      } catch (e: any) {
        addNotification({
          title: 'Error opening file',
          message: e?.message || 'Could not read file',
          type: 'error',
        });
      }
    }
  }, [initialPath]);

  const handleSave = (path = filePath) => {
    try {
      fs.writeFile(path, content);
      saveFileSystem();
      setSavedContent(content);
      setFilePath(path);
      addNotification({
        title: 'File Saved',
        message: `Saved '${path}' successfully.`,
        type: 'success',
      });
    } catch (e: any) {
      addNotification({
        title: 'Save Error',
        message: e?.message || 'Failed to save file.',
        type: 'error',
      });
    }
  };

  const handleOpenPath = (path: string) => {
    try {
      const resolved = fs.resolve(path);
      if (!fs.exists(resolved)) {
        addNotification({
          title: 'File Not Found',
          message: `No file at '${resolved}'`,
          type: 'error',
        });
        return;
      }
      if (fs.isDirectory(resolved)) {
        addNotification({
          title: 'Cannot Open Directory',
          message: `'${resolved}' is a directory, not a text file.`,
          type: 'warning',
        });
        return;
      }
      const fileData = fs.readFile(resolved);
      setContent(fileData);
      setSavedContent(fileData);
      setFilePath(resolved);
      setOpenFileModalOpen(false);
      addNotification({
        title: 'File Opened',
        message: `Opened '${resolved}'`,
        type: 'info',
      });
    } catch (e: any) {
      addNotification({
        title: 'Open Error',
        message: e?.message || 'Failed to open file.',
        type: 'error',
      });
    }
  };

  const handleNew = () => {
    if (isDirty && !window.confirm('You have unsaved changes. Discard them?')) {
      return;
    }
    setContent('');
    setSavedContent('');
    setFilePath('/home/kali/Documents/untitled.txt');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl+S / Cmd+S
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      handleSave();
      return;
    }

    // Ctrl+F search
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
      e.preventDefault();
      setShowSearch(!showSearch);
      return;
    }

    // Tab key: insert 2 spaces
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newText = content.substring(0, start) + '  ' + content.substring(end);
      setContent(newText);

      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
  };

  const updateCursorPosition = () => {
    if (!textareaRef.current) return;
    const text = textareaRef.current.value;
    const selStart = textareaRef.current.selectionStart;
    const lines = text.substring(0, selStart).split('\n');
    const line = lines.length;
    const col = lines[lines.length - 1].length + 1;
    setCursorPos({ line, col });
  };

  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const lines = content.split('\n');
  const lineCount = Math.max(lines.length, 1);

  return (
    <div className="flex flex-col h-full bg-[#121624] text-gray-200 select-none font-sans text-xs">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#181e32] border-b border-[#2d3752]">
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleNew}
            className="px-2 py-1 rounded bg-[#242e4c] hover:bg-[#324068] text-gray-200 border border-[#394970] flex items-center gap-1"
          >
            <span>📄</span> New
          </button>
          <button
            onClick={() => setOpenFileModalOpen(true)}
            className="px-2 py-1 rounded bg-[#242e4c] hover:bg-[#324068] text-gray-200 border border-[#394970] flex items-center gap-1"
          >
            <span>📂</span> Open
          </button>
          <button
            onClick={() => handleSave()}
            className="px-2.5 py-1 rounded bg-[#367bf0] hover:bg-[#2d66c9] text-white font-medium flex items-center gap-1"
          >
            <span>💾</span> Save
          </button>
          <button
            onClick={() => {
              setSaveAsPath(filePath);
              setSaveAsModalOpen(true);
            }}
            className="px-2 py-1 rounded bg-[#242e4c] hover:bg-[#324068] text-gray-200 border border-[#394970] flex items-center gap-1"
          >
            <span>💾...</span> Save As
          </button>
          <button
            onClick={() => setShowSearch(!showSearch)}
            className={`px-2 py-1 rounded border border-[#394970] flex items-center gap-1 ${
              showSearch ? 'bg-[#367bf0]/30 text-white' : 'bg-[#242e4c] text-gray-200 hover:bg-[#324068]'
            }`}
          >
            <span>🔍</span> Find
          </button>
        </div>

        {/* Current file path info */}
        <div className="flex items-center gap-2 font-mono text-[11px] text-gray-300">
          <span className="text-gray-400">{filePath}</span>
          {isDirty && (
            <span className="px-1.5 py-0.5 rounded bg-yellow-600/30 text-yellow-300 border border-yellow-500/50 text-[10px]">
              Modified ●
            </span>
          )}
        </div>
      </div>

      {/* Find / Search Bar */}
      {showSearch && (
        <div className="flex items-center gap-2 px-3 py-1 bg-[#1a233a] border-b border-[#2d3752]">
          <span className="text-gray-400">Find:</span>
          <input
            type="text"
            autoFocus
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search text..."
            className="bg-[#101422] border border-[#394970] rounded px-2 py-0.5 text-white outline-none focus:border-[#367bf0] text-xs w-48 font-mono"
          />
          {searchQuery && (
            <span className="text-gray-400 text-[11px]">
              {content.split(searchQuery).length - 1} matches
            </span>
          )}
          <button
            onClick={() => setShowSearch(false)}
            className="text-gray-400 hover:text-white ml-auto"
          >
            ✕
          </button>
        </div>
      )}

      {/* Editor Body */}
      <div className="flex flex-1 overflow-hidden relative font-mono text-sm bg-[#0d111d]">
        {/* Line Numbers Gutter */}
        <div
          ref={lineNumbersRef}
          className="w-12 py-3 pr-2 text-right text-gray-600 select-none bg-[#0a0d17] border-r border-[#1e2740] font-mono text-xs overflow-hidden leading-relaxed shrink-0"
        >
          {Array.from({ length: lineCount }).map((_, i) => (
            <div
              key={i}
              className={cursorPos.line === i + 1 ? 'text-[#367bf0] font-semibold' : ''}
            >
              {i + 1}
            </div>
          ))}
        </div>

        {/* Text Area */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          onKeyUp={updateCursorPosition}
          onClick={updateCursorPosition}
          onScroll={handleScroll}
          spellCheck={false}
          className="flex-1 p-3 bg-transparent text-gray-100 resize-none outline-none overflow-auto font-mono text-xs leading-relaxed selection:bg-[#367bf0]/40 tab-4"
        />
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-3 py-1 bg-[#14192b] border-t border-[#252e46] text-[11px] text-gray-400 font-mono">
        <div className="flex items-center gap-4">
          <span>
            Ln {cursorPos.line}, Col {cursorPos.col}
          </span>
          <span>{lines.length} lines</span>
          <span>{content.length} chars</span>
        </div>
        <div className="flex items-center gap-4">
          <span>UTF-8</span>
          <span>Linux (LF)</span>
          <span>{filePath.endsWith('.py') ? 'Python' : filePath.endsWith('.sh') ? 'Shell Script' : filePath.endsWith('.json') ? 'JSON' : 'Plain Text'}</span>
        </div>
      </div>

      {/* Save As Modal */}
      {saveAsModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a2138] border border-[#394970] rounded-lg shadow-xl p-4 w-96 max-w-full text-gray-200">
            <h3 className="text-sm font-semibold mb-3">Save As</h3>
            <label className="text-[11px] text-gray-400 block mb-1">Target File Path:</label>
            <input
              type="text"
              autoFocus
              value={saveAsPath}
              onChange={(e) => setSaveAsPath(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSave(saveAsPath);
                  setSaveAsModalOpen(false);
                } else if (e.key === 'Escape') {
                  setSaveAsModalOpen(false);
                }
              }}
              className="w-full bg-[#121624] border border-[#394970] rounded px-3 py-1.5 text-xs text-white font-mono outline-none focus:border-[#367bf0] mb-4"
            />
            <div className="flex justify-end gap-2 text-xs">
              <button
                onClick={() => setSaveAsModalOpen(false)}
                className="px-3 py-1.5 rounded bg-[#242e4c] hover:bg-[#2f3d64] text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleSave(saveAsPath);
                  setSaveAsModalOpen(false);
                }}
                className="px-3 py-1.5 rounded bg-[#367bf0] hover:bg-[#2d66c9] text-white font-medium"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Open File Modal */}
      {openFileModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a2138] border border-[#394970] rounded-lg shadow-xl p-4 w-96 max-w-full text-gray-200">
            <h3 className="text-sm font-semibold mb-3">Open File</h3>
            <label className="text-[11px] text-gray-400 block mb-1">Enter File Path:</label>
            <input
              type="text"
              autoFocus
              value={openFilePath}
              onChange={(e) => setOpenFilePath(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleOpenPath(openFilePath);
                } else if (e.key === 'Escape') {
                  setOpenFileModalOpen(false);
                }
              }}
              className="w-full bg-[#121624] border border-[#394970] rounded px-3 py-1.5 text-xs text-white font-mono outline-none focus:border-[#367bf0] mb-4"
            />
            <div className="flex justify-end gap-2 text-xs">
              <button
                onClick={() => setOpenFileModalOpen(false)}
                className="px-3 py-1.5 rounded bg-[#242e4c] hover:bg-[#2f3d64] text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => handleOpenPath(openFilePath)}
                className="px-3 py-1.5 rounded bg-[#367bf0] hover:bg-[#2d66c9] text-white font-medium"
              >
                Open
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TextEditor;

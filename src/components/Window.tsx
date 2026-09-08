import React, { useState, useRef, useEffect, lazy, Suspense } from 'react';
import type { WindowState } from '../types';
import { useStore } from '../store';

interface WindowProps {
  window: WindowState;
}

const componentMap: Record<string, React.LazyExoticComponent<React.ComponentType<any>>> = {
  Terminal: lazy(() => import('./apps/Terminal')),
  XTerminal: lazy(() => import('./apps/XTerminal')),
  FileManager: lazy(() => import('./apps/FileManager')),
  TextEditor: lazy(() => import('./apps/TextEditor')),
  Browser: lazy(() => import('./apps/Browser')),
  Settings: lazy(() => import('./apps/Settings')),
  SystemMonitor: lazy(() => import('./apps/SystemMonitor')),
  SecurityLab: lazy(() => import('./apps/SecurityLab')),
  ToolsLauncher: lazy(() => import('./apps/ToolsLauncher')),
  WirelessLab: lazy(() => import('./apps/WirelessLab')),
  About: lazy(() => import('./apps/About')),
};

type ResizeDirection =
  | 'n' | 's' | 'e' | 'w'
  | 'ne' | 'nw' | 'se' | 'sw'
  | null;

export default function Window({ window: win }: WindowProps) {
  const {
    focusWindow,
    closeWindow,
    minimizeWindow,
    maximizeWindow,
    restoreWindow,
    updateWindowPosition,
    updateWindowSize,
  } = useStore();

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<ResizeDirection>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({
    x: 0, y: 0,
    width: 0, height: 0,
    windowX: 0, windowY: 0
  });

  const windowRef = useRef<HTMLDivElement>(null);
  const Component = componentMap[win.component];

  // Focus window on click
  const handleFocus = () => {
    if (!win.isActive) {
      focusWindow(win.id);
    }
  };

  // Dragging logic
  const handleTitleBarMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    if ((e.target as HTMLElement).closest('button')) return; // Don't drag on buttons

    e.preventDefault();
    handleFocus();

    if (win.isMaximized) return;

    setIsDragging(true);
    setDragStart({
      x: e.clientX - win.x,
      y: e.clientY - win.y,
    });
  };

  const handleTitleBarDoubleClick = () => {
    if (win.isMaximized) {
      restoreWindow(win.id);
    } else {
      maximizeWindow(win.id);
    }
  };

  // Resize logic
  const getResizeDirection = (e: React.MouseEvent, rect: DOMRect): ResizeDirection => {
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const edge = 8; // resize handle width

    const onTop = y < edge;
    const onBottom = y > rect.height - edge;
    const onLeft = x < edge;
    const onRight = x > rect.width - edge;

    if (onTop && onLeft) return 'nw';
    if (onTop && onRight) return 'ne';
    if (onBottom && onLeft) return 'sw';
    if (onBottom && onRight) return 'se';
    if (onTop) return 'n';
    if (onBottom) return 's';
    if (onLeft) return 'w';
    if (onRight) return 'e';

    return null;
  };

  const getCursor = (direction: ResizeDirection): string => {
    if (!direction) return 'default';
    const cursors: Record<string, string> = {
      n: 'ns-resize',
      s: 'ns-resize',
      e: 'ew-resize',
      w: 'ew-resize',
      ne: 'nesw-resize',
      sw: 'nesw-resize',
      nw: 'nwse-resize',
      se: 'nwse-resize',
    };
    return cursors[direction] || 'default';
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (win.isMaximized) return;
    if (!windowRef.current) return;

    const rect = windowRef.current.getBoundingClientRect();
    const direction = getResizeDirection(e, rect);

    if (direction) {
      e.preventDefault();
      handleFocus();
      setIsResizing(true);
      setResizeDirection(direction);
      setResizeStart({
        x: e.clientX,
        y: e.clientY,
        width: win.width,
        height: win.height,
        windowX: win.x,
        windowY: win.y,
      });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const newX = Math.max(0, Math.min(e.clientX - dragStart.x, window.innerWidth - 100));
      const newY = Math.max(40, Math.min(e.clientY - dragStart.y, window.innerHeight - 100));
      updateWindowPosition(win.id, newX, newY);
    } else if (isResizing && resizeDirection) {
      const dx = e.clientX - resizeStart.x;
      const dy = e.clientY - resizeStart.y;

      let newWidth = resizeStart.width;
      let newHeight = resizeStart.height;
      let newX = resizeStart.windowX;
      let newY = resizeStart.windowY;

      if (resizeDirection.includes('e')) {
        newWidth = Math.max(win.minWidth, resizeStart.width + dx);
      }
      if (resizeDirection.includes('w')) {
        const proposedWidth = resizeStart.width - dx;
        if (proposedWidth >= win.minWidth) {
          newWidth = proposedWidth;
          newX = resizeStart.windowX + dx;
        }
      }
      if (resizeDirection.includes('s')) {
        newHeight = Math.max(win.minHeight, resizeStart.height + dy);
      }
      if (resizeDirection.includes('n')) {
        const proposedHeight = resizeStart.height - dy;
        if (proposedHeight >= win.minHeight) {
          newHeight = proposedHeight;
          newY = resizeStart.windowY + dy;
        }
      }

      // Keep within bounds
      newX = Math.max(0, Math.min(newX, window.innerWidth - 100));
      newY = Math.max(40, Math.min(newY, window.innerHeight - 100));

      updateWindowPosition(win.id, newX, newY);
      updateWindowSize(win.id, newWidth, newHeight);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeDirection(null);
  };

  // Handle cursor changes on hover
  const handleMouseMoveWindow = (e: React.MouseEvent) => {
    if (win.isMaximized || isDragging || isResizing) return;
    if (!windowRef.current) return;

    const rect = windowRef.current.getBoundingClientRect();
    const direction = getResizeDirection(e, rect);
    windowRef.current.style.cursor = getCursor(direction);
  };

  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, dragStart, resizeStart, resizeDirection]);

  if (win.isMinimized) {
    return null;
  }

  // Calculate style for maximized or normal
  const windowStyle: React.CSSProperties = win.isMaximized
    ? {
        position: 'fixed',
        left: 0,
        top: 32, // Below top panel
        width: '100vw',
        height: 'calc(100vh - 32px)',
        zIndex: win.zIndex,
      }
    : {
        position: 'fixed',
        left: `${win.x}px`,
        top: `${win.y}px`,
        width: `${win.width}px`,
        height: `${win.height}px`,
        zIndex: win.zIndex,
      };

  return (
    <div
      ref={windowRef}
      style={windowStyle}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMoveWindow}
      onClick={handleFocus}
      className={`
        flex flex-col
        bg-[#1a1f36]/95 backdrop-blur-md
        rounded-lg overflow-hidden
        transition-shadow duration-150
        window-open
        pointer-events-auto
        ${
          win.isActive
            ? 'shadow-2xl shadow-blue-500/10 ring-1 ring-blue-500/50'
            : 'shadow-lg ring-1 ring-gray-700/50 opacity-95'
        }
        ${win.isMaximized ? 'rounded-none ring-0' : ''}
      `}
    >
      {/* Title Bar */}
      <div
        onMouseDown={handleTitleBarMouseDown}
        onDoubleClick={handleTitleBarDoubleClick}
        className={`
          flex items-center justify-between
          px-3 py-2
          border-b border-gray-700/50
          select-none
          cursor-default
          ${
            win.isActive
              ? 'bg-gradient-to-r from-gray-800 to-gray-850 text-gray-200'
              : 'bg-gray-850 text-gray-400'
          }
        `}
      >
        {/* Left: Icon & Title */}
        <div className="flex items-center space-x-2 overflow-hidden flex-1 min-w-0 pr-2">
          <span className="text-base flex-shrink-0">{win.icon}</span>
          <span className="text-xs font-semibold truncate tracking-wide">
            {win.title}
          </span>
        </div>

        {/* Right: Window Controls */}
        <div className="flex items-center space-x-1 flex-shrink-0">
          {/* Minimize Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              minimizeWindow(win.id);
            }}
            title="Minimize"
            className="
              w-6 h-6
              flex items-center justify-center
              rounded
              text-gray-400 hover:text-gray-200
              hover:bg-gray-700/50
              active:bg-gray-600/50
              transition-colors
              text-xs
            "
          >
            ―
          </button>

          {/* Maximize/Restore Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (win.isMaximized) {
                restoreWindow(win.id);
              } else {
                maximizeWindow(win.id);
              }
            }}
            title={win.isMaximized ? 'Restore' : 'Maximize'}
            className="
              w-6 h-6
              flex items-center justify-center
              rounded
              text-gray-400 hover:text-gray-200
              hover:bg-gray-700/50
              active:bg-gray-600/50
              transition-colors
              text-xs
            "
          >
            {win.isMaximized ? '❐' : '□'}
          </button>

          {/* Close Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              closeWindow(win.id);
            }}
            title="Close"
            className="
              w-6 h-6
              flex items-center justify-center
              rounded
              text-gray-400 hover:text-white
              hover:bg-red-500/80
              active:bg-red-600
              transition-colors
              text-sm
            "
          >
            ✕
          </button>
        </div>
      </div>

      {/* Window Body / Application Content */}
      <div className="flex-1 overflow-hidden relative bg-[#0a0e27]/90">
        {Component ? (
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                <div className="animate-spin mr-2">⚙</div>
                Loading...
              </div>
            }
          >
            <Component {...(win.props || {})} />
          </Suspense>
        ) : (
          <div className="flex items-center justify-center h-full text-red-400 text-sm">
            Unknown application: {win.component}
          </div>
        )}
      </div>
    </div>
  );
}

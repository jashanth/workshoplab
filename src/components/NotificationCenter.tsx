import { useStore } from '../store';

export default function NotificationCenter() {
  const notifications = useStore((s) => s.notifications);
  const removeNotification = useStore((s) => s.removeNotification);

  if (notifications.length === 0) return null;

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-green-500/40 bg-green-950/40 text-green-200';
      case 'warning':
        return 'border-yellow-500/40 bg-yellow-950/40 text-yellow-200';
      case 'error':
        return 'border-red-500/40 bg-red-950/40 text-red-200';
      default:
        return 'border-blue-500/40 bg-blue-950/40 text-blue-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success':
        return '✓';
      case 'warning':
        return '⚠';
      case 'error':
        return '✕';
      default:
        return 'ℹ';
    }
  };

  return (
    <div className="fixed top-10 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
      {notifications.map((n) => (
        <div
          key={n.id}
          className={`pointer-events-auto p-3 rounded-lg border backdrop-blur-md shadow-xl flex items-start gap-3 text-xs transition-all duration-300 animate-slide-in ${getTypeStyles(
            n.type
          )}`}
        >
          <span className="font-bold text-sm leading-none mt-0.5">
            {getTypeIcon(n.type)}
          </span>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-white/90">{n.title}</div>
            <div className="text-white/70 mt-0.5 break-words">{n.message}</div>
          </div>
          <button
            onClick={() => removeNotification(n.id)}
            className="text-white/40 hover:text-white/90 transition-colors text-sm leading-none p-1"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

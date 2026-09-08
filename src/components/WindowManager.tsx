import { useStore } from '../store';
import Window from './Window';

export default function WindowManager() {
  const windows = useStore((state) => state.windows);
  const activeWorkspace = useStore((state) => state.activeWorkspace);

  return (
    <>
      {windows
        .filter((w) => w.workspace === activeWorkspace && !w.isMinimized)
        .map((window) => (
          <Window key={window.id} window={window} />
        ))}
    </>
  );
}

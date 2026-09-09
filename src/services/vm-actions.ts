import { AuthService } from './auth';
import { useStore } from '../store';

export const restartVM = () => {
  const { setPhase, setPoweredOff, addNotification } = useStore.getState();

  AuthService.logout();
  setPoweredOff(false);
  addNotification({
    title: 'Restarting',
    message: 'Virtual machine is restarting...',
    type: 'info',
  });
  setPhase('boot');

  setTimeout(() => setPhase('login'), 3800);
};

export const shutdownVM = () => {
  const { setPhase, setPoweredOff, addNotification } = useStore.getState();

  AuthService.logout();
  addNotification({
    title: 'Shutting Down',
    message: 'Virtual machine is powering off...',
    type: 'info',
  });
  setPoweredOff(true);
  setPhase('login');
};
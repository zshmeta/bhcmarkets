import {useNotifBell} from './useNotifBell';
import {NotifBellView} from './NotifBell.view';

const NotifBell = () => {
  const props = useNotifBell();
  return <NotifBellView {...props} />;
}

export { NotifBell };

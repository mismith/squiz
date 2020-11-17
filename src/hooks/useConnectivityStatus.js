import { useCallback, useEffect } from 'react';

import { ServerValue } from '../helpers/firebase';

export default function useConnectivityStatus(ref, key = 'inactive') {
  const setInactive = useCallback(async to => { // @TODO: avoid possible async races when setting
    const parentExists = (await ref.once('value')).exists();
    if (parentExists) {
      const childRef = ref.child(key);
      const isInactive = (await childRef.once('value')).val();
      if ((isInactive && !to) || (!isInactive && to)) {
        await childRef.set(to);
      }
    }
  }, [ref, key]);

  useEffect(() => {
    // activate on load
    setInactive(null);

    // monitor tab changes
    const handleVisibilityChange = () => {
      setInactive(document.hidden ? ServerValue.TIMESTAMP : null);
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // monitor tab closes
    const handleBeforeUnload = () => {
      setInactive(ServerValue.TIMESTAMP);
    };
    document.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      handleBeforeUnload();

      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);
}

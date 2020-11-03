import { useEffect } from 'react';

import { FieldValue } from '../helpers/firebase';

export default function useConnectivityStatus(ref, key = 'inactive') {
  useEffect(() => {
    const setInactive = to => ref.set({
      [key]: to,
    }, { merge: true });

    // monitor tab changes
    const handleVisibilityChange = () => {
      setInactive(document.hidden ? FieldValue.serverTimestamp() : FieldValue.delete());
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // monitor tab closes
    const handleBeforeUnload = () => {
      setInactive(FieldValue.serverTimestamp());
    };
    document.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [ref]);
}

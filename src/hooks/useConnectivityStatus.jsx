import { useEffect, useState } from 'react';

import { FieldValue } from '../helpers/firebase';

export default function useConnectivityStatus(ref, key = 'inactive') {
  const [isHidden, setHidden] = useState(document.hidden);

  useEffect(() => {
    const setInactive = to => ref.set({
      [key]: to,
    }, { merge: true });

    // monitor tab changes
    const handleVisibilityChange = () => {
      if (document.hidden !== isHidden) {
        setInactive(document.hidden ? FieldValue.serverTimestamp() : FieldValue.delete());
        setHidden(document.hidden);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    handleVisibilityChange();

    // monitor tab closes
    const handleBeforeUnload = () => {
      setInactive(FieldValue.serverTimestamp());
    };
    document.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [ref, key]);
}

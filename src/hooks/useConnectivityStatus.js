import { useEffect, useState } from 'react';

import { ServerValue } from '../helpers/firebase';

export default function useConnectivityStatus(ref, key = 'inactive') {
  const [isHidden, setHidden] = useState(document.hidden);

  useEffect(() => {
    const setInactive = to => ref.child(key).set(to);

    // activate on load
    setInactive(null);

    // monitor tab changes
    const handleVisibilityChange = () => {
      if (document.hidden !== isHidden) {
        setInactive(document.hidden ? ServerValue.TIMESTAMP : null);
        setHidden(document.hidden);
      }
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
  }, [ref, key]);
}

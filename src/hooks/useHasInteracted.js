import { useCallback, useEffect, useState } from 'react';

export default function useHasInteracted() {
  const [hasInteracted, setHasInteracted] = useState(false);
  const handleInteraction = useCallback(() => {
    if (!hasInteracted) {
      setHasInteracted(true);
      remove();
    }
  }, []);
  const remove = useCallback(() => {
    document.removeEventListener('click', handleInteraction);
    document.removeEventListener('touchstart', handleInteraction);
  }, []);
  useEffect(() => {
    document.addEventListener('click', handleInteraction);
    document.addEventListener('touchstart', handleInteraction);

    return () => {
      remove();
    };
  }, []);

  return hasInteracted;
}

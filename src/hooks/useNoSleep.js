import { useEffect } from 'react';
import NoSleep from 'nosleep.js';

const noSleep = new NoSleep();
export default function useNoSleep() {
  useEffect(() => {
    const add = () => {
      remove();
      noSleep.enable();
    };
    const remove = () => {
      document.removeEventListener('click', add);
      document.removeEventListener('touchstart', add);
    };
    document.addEventListener('click', add);
    document.addEventListener('touchstart', add);

    return () => {
      remove();
      noSleep.disable();
    };
  }, []);
}

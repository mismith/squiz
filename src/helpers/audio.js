import { useCallback, useEffect, useRef, useState } from 'react';

import START from '../sounds/start.mp3';
import END from '../sounds/end.mp3';
import { CHOICES_TIMEOUT } from './game';

export const SOUNDS = {
  // @TODO: add credit for zapslpat.com: https://www.zapsplat.com/license-type/standard-license/
  START,
  END,
};
export function playSound(src) {
  const sound = new Audio(src);
  sound.addEventListener('loadeddata', () => sound.play());
}

export let player;
let timeout;
const timer = { progress: 0 };

export function setTimeout(...args) {
  if (args.length) {
    timeout = window.setTimeout(...args);
  }
  return timeout;
}

export function load(src) {
  return new Promise((resolve, reject) => {
    if (player) player.pause();

    const newPlayer = new Audio(src);
    newPlayer.addEventListener('loadeddata', () => {
      if (player === newPlayer) {
        resolve(newPlayer);
      }
    });
    newPlayer.addEventListener('error', (err) => {
      if (player === newPlayer) {
        reject(err);
      }
    });
    player = newPlayer;
  });
}

export async function play(src = undefined, triggerProgress = true) {
  if (triggerProgress) {
    timer.progress = Date.now();
  }
  if (src) {
    await load(src);
  }
  if (player) {
    player.play();
  }
}

export function stop(clearTimeout = true, triggerProgress = true) {
  if (triggerProgress && timer.progress) {
    timer.progress = 0;
  }
  if (player) {
    player.pause();
    player = null;
  }
  if (clearTimeout && timeout) {
    window.clearTimeout(timeout);
    timeout = null;
  }
}

export function isPlaying() {
  return timer.progress > 0;
}

export function useProgress(total = CHOICES_TIMEOUT) {
  const [progress, setProgress] = useState(0);
  const ref = useRef();
  const animate = useCallback(() => {
    if (timer.progress) {
      const elapsed = Date.now() - timer.progress;
      setProgress(Math.round(elapsed / total * 100));
    } else {
      setProgress(0);
    }
    ref.current = window.requestAnimationFrame(animate);
  }, [total]);
  useEffect(() => {
    animate();
    return () => window.cancelAnimationFrame(ref.current);
  }, [animate]);

  return progress;
}

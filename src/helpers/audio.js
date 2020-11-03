import { useEffect, useRef, useState } from 'react';
import { CHOICES_TIMEOUT } from './game';

export let player;
let timeout;
const timer = { start: 0 };

export function setTimeout(...args) {
  if (args.length) {
    timeout = window.setTimeout(...args);
  }
  return timeout;
}

export function stop(clearTimeout = true) {
  timer.start = 0;
  if (player) {
    player.pause();
    player = null;
  }
  if (clearTimeout && timeout) {
    window.clearTimeout(timeout);
    timeout = null;
  }
}

export function load(src) {
  return new Promise((resolve, reject) => {
    stop(false);

    const audioPlayer = new Audio(src);
    player = audioPlayer;
    audioPlayer.addEventListener('loadeddata', () => {
      if (player === audioPlayer) {
        resolve(audioPlayer);
      }
    });
    audioPlayer.addEventListener('error', (err) => {
      if (player === audioPlayer) {
        reject(err);
      }
    });
  });
}

export async function play(src = undefined) {
  if (src) await load(src);
  if (player) player.play();
  timer.start = Date.now();
}

export function useProgress(total = CHOICES_TIMEOUT) {
  const [progress, setProgress] = useState(0);
  const ref = useRef();
  const animate = () => {
    if (timer.start) {
      const elapsed = Date.now() - timer.start;
      setProgress(Math.round(elapsed / total * 100));
    }
    ref.current = window.requestAnimationFrame(animate);
  };
  useEffect(() => {
    ref.current = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(ref.current);
  }, []);

  return progress;
}
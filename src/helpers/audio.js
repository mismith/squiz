export let player;
let timeout;

export function setTimeout(...args) {
  if (args.length) {
    timeout = window.setTimeout(...args);
  }
  return timeout;
}

export function stop(clearTimeout = true) {
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
}

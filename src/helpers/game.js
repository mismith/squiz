import { useListVals } from 'react-firebase-hooks/database';
import weightedRandom from 'weighted-random';

import { refs, keyField, ServerValue } from './firebase';
import * as audio from './audio';

export const ROUNDS_LIMIT = 5;
export const TRACKS_LIMIT = 8;
export const CHOICES_TIMEOUT = 10 * 1000;
export const CHOICES_STARTUP = 1 * 1000;
export const RESULTS_TIMEOUT = 3 * 1000;

export const getRandomID = (items = []) => {
  const randomIndex = Math.floor(Math.random() * items.length);
  const randomItem = items[randomIndex];
  return randomItem?.id;
};
export function pickRandomTrack(tracks = []) {
  const weights = tracks.map(({ popularity }, index) => {
    const orderWeight = (tracks.length - index) / tracks.length * 50;
    return popularity + orderWeight;
  });
  const trackIndex = weightedRandom(weights);
  const track = tracks[trackIndex];
  return track;
}
export function usePickedTracks(roundID, possibleTracks = [], usedTrackIDs = []) {
  const [tracks = [], loading, error] = useListVals(roundID && refs.tracks(roundID), { keyField });

  const pickedTrackIDs = tracks
    .map(({ correctID }) => correctID);
  const pickedTracks = pickedTrackIDs
    .map(trackID => possibleTracks.find(({ id }) => id === trackID))
    .filter(Boolean);
  const unpickedTracks = possibleTracks
    .filter(({ preview_url }) => preview_url)
    .filter(({ id }) => !pickedTrackIDs.includes(id))
    .filter(({ id }) => !usedTrackIDs.includes(id));

  return {
    pickedTracks,
    unpickedTracks,
    loading,
    error,
  };
}

export const trimItem = ({ id, name }) => ({ id, name });
export const trimTrack = (track) => ({
  ...trimItem(track),
  artists: track.artists.map(trimItem),
  album: {
    ...trimItem(track.album),
    image: track.album.images[0].url,
  },
});

export function getPointsForTrackGuess(track, guess) {
  if (track?.correctID && guess?.choiceID) {
    const isCorrect = track.correctID === guess.choiceID;
    if (isCorrect) {
      const trackAcceptsSwipesAt = track?.timestamp || 0;
      const playerSwipedAt = guess?.timestamp || 0;
      // give players a 'head start' in order to process the visuals/sounds
      const reactionTime = playerSwipedAt - trackAcceptsSwipesAt - CHOICES_STARTUP; 
      const percent = Math.round(reactionTime / CHOICES_TIMEOUT * 100);
      const points = 100 - Math.min(Math.max(0, percent), 100);
      return points;
    }
    return 0;
  }
  return null;
}
export async function getScores(gameID) {
  const scores = {};
  scores[gameID] = {};
  await new Promise(r1 => refs.rounds(gameID).once('value', async roundsSnap => {
    const p1 = [];
    roundsSnap.forEach(round => {
      const roundID = round.key;
      scores[gameID][roundID] = {}
      p1.push(new Promise(r2 => refs.tracks(roundID).once('value', async tracksSnap => {
        const p2 = [];
        tracksSnap.forEach(track => {
          const trackID = track.key;
          scores[gameID][roundID][trackID] = {};
          if (track.val()?.completed) { // don't include guesses until the track complete
            p2.push(new Promise(r3 => refs.guesses(trackID).once('value', guessesSnap => {
              guessesSnap.forEach(guess => {
                const playerID = guess.key;
                const points = getPointsForTrackGuess(track.val(), guess.val());
                scores[gameID][roundID][trackID][playerID] = points;
              });
              r3();
            })));
          }
        });
        await Promise.all(p2);
        r2();
      })));
    });
    await Promise.all(p1);
    r1();
  }));
  return scores;
}
export function getPlayerScore(scores, gameID, playerID) {
  let score = 0;
  Object.values(scores?.[gameID] || {}).forEach((round) => {
    Object.values(round || {}).forEach((track) => {
      score += track[playerID] || 0;
    });
  });
  return score;
}

export function generateGameID() {
  return `${Math.round(Math.random() * 8999) + 1000}`; // [1000, 9999]
}

export async function startGame(gameID) {
  return refs.game(gameID).set({
    timestamp: ServerValue.TIMESTAMP,
  });
}
export async function restartGame(gameID) {
  const playersRef = refs.players(gameID);
  const playerIDs = Object.keys((await playersRef.once('value')).val());

  await Promise.all([
    refs.rounds(gameID).remove(),
    ...playerIDs.map(playerID => playersRef.child(playerID).child('score').remove()),
  ]);

  return startGame(gameID);
}
export async function pauseGame(gameID) {
  return refs.game(gameID).update({
    paused: ServerValue.TIMESTAMP,
  });
}
export async function resumeGame(gameID) {
  return refs.game(gameID).update({
    paused: null,
  });
}
export async function endGame(gameID) {
  return refs.game(gameID).update({
    completed: ServerValue.TIMESTAMP,
  });
}

export async function startRound(gameID, playlistID) {
  return refs.rounds(gameID).push({
    playlistID,
    timestamp: ServerValue.TIMESTAMP,
  });
}
export async function endRound(gameID, roundID) {
  return refs.round(gameID, roundID).update({
    completed: ServerValue.TIMESTAMP,
  });
}

export async function restartTrack(roundID, trackID) {
  return Promise.all([
    refs.track(roundID, trackID).update({
      timestamp: ServerValue.TIMESTAMP,
    }),
    refs.guesses(trackID).remove(),
  ]);
}
export async function endTrack(roundID, trackID) {
  audio.stop(undefined, false); // don't clear progress so as to avoid 'flashing' bar

  return refs.track(roundID, trackID).update({
    completed: ServerValue.TIMESTAMP,
  });
}

export async function removePlayer(gameID, playerID) {
  return refs.player(gameID, playerID).remove();
}

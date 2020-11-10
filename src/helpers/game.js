import { useRouteMatch } from 'react-router-dom';
import { useCollection, useCollectionData, useDocumentData } from 'react-firebase-hooks/firestore';
import weightedRandom from 'weighted-random';

import { firestore, FieldValue } from './firebase';
import * as audio from './audio';

export const ROUNDS_LIMIT = 5;
export const TRACKS_LIMIT = 8;
export const CHOICES_TIMEOUT = 10 * 1000;
export const CHOICES_STARTUP = 1 * 1000;
export const RESULTS_TIMEOUT = 3 * 1000;

export const getRandomID = (items = []) => {
  const randomIndex = Math.floor(Math.random() * items.length);
  const randomItem = items[randomIndex];
  return randomItem && randomItem.id;
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

export function useLatestDocument(ref) {
  const query = ref && ref.orderBy('timestamp', 'desc').limit(1);
  const { value: { docs: [value] = [] } = {}, loading, error } = useCollection(query);

  return {
    value,
    loading,
    error,
  };
}

export function useTrack(roundRef, possibleTracks = [], usedTrackIDs = []) {
  const tracksRef = roundRef?.collection('tracks');
  const {
    value: tracks = [],
    loading: tracksLoading,
  } = useCollectionData(tracksRef?.orderBy('timestamp'), null, 'id');

  const { value: { ref: trackRef } = {}, loading: trackRefLoading } = useLatestDocument(tracksRef);
  const { value: track, loading: trackLoading } = useDocumentData(trackRef, null, 'id');

  const pickedTrackIDs = tracks.map(({ id }) => id);
  const pickedTracks = pickedTrackIDs
    .map(id => possibleTracks.find(track => track.id === id))
    .filter(Boolean);
  const unpickedTracks = possibleTracks
    .filter(({ id }) => !pickedTrackIDs.includes(id))
    .filter(({ id }) => !usedTrackIDs.includes(id));

  const loading = tracksLoading || trackRefLoading || trackLoading;

  return {
    tracksRef,
    pickedTracks,
    unpickedTracks,
    trackRef,
    track,
    loading,
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

export function getTrackPointsForPlayer(track, playerID) {
  const player = track?.players?.[playerID];
  if (player) {
    const playerSwipedAt = player.timestamp?.toDate().getTime() || 0;
    const trackAcceptsSwipesAt = track.timestamp?.toDate().getTime() || 0;
    // give players a 'head start' in order to process the visuals/sounds
    const reactionTime = playerSwipedAt - trackAcceptsSwipesAt - CHOICES_STARTUP; 
    const percent = Math.round(reactionTime / CHOICES_TIMEOUT * 100);
    const points = 100 - Math.min(Math.max(0, percent), 100);
    return points;
  }
  return null;
}

export async function scorePlayerResponses(gameRef, track) {
  return Promise.all(Object.entries(track.players || {}).map(async ([playerID, response]) => {
    const isCorrect = track.id === response.choiceID;
    if (isCorrect) {
      const points = getTrackPointsForPlayer(track, playerID);
      const playerRef = gameRef.collection('players').doc(playerID);
      const { score } = (await playerRef.get()).data();

      return playerRef.set({
        score: (score || 0) + (points || 0),
      }, { merge: true });
    }
    return null;
  }));
}

export async function pauseGame(gameRef) {
  return gameRef.set({
    paused: FieldValue.serverTimestamp(),
  }, { merge: true });
}
export async function resumeGame(gameRef) {
  return gameRef.set({
    paused: FieldValue.delete(),
  }, { merge: true });
}

export async function endGame(gameRef) {
  return gameRef.set({
    completed: FieldValue.serverTimestamp(),
  }, { merge: true });
}
export async function endRound(roundRef) {
  return roundRef.set({
    completed: FieldValue.serverTimestamp(),
  }, { merge: true });
}
export async function endTrack(trackRef) {
  audio.stop(undefined, false); // don't clear progress so as to avoid 'flashing' bar

  return trackRef.set({
    completed: FieldValue.serverTimestamp(),
  }, { merge: true });
}

export function useGame() {
  const { params: { gameID } } = useRouteMatch();
  const gameRef = firestore.collection('games').doc(String(gameID));
  const game = useDocumentData(gameRef, null, 'id');
  return [game, gameRef];
}

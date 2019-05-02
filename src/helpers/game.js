import { useCollectionData } from 'react-firebase-hooks/firestore';
import weightedRandom from 'weighted-random';

export const ROUNDS_LIMIT = 5;
export const TRACKS_LIMIT = 10;
export const CHOICES_TIMEOUT = 10 * 1000;
export const CHOICES_STARTUP = 1 * 1000;
export const RESULTS_TIMEOUT = 3 * 1000;
export const RESULTS_COUNTUP = 1 * 1000;

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

export function useTrack(roundRef, possibleTracks = undefined) {
  const tracksRef = roundRef && roundRef.collection('tracks');
  const { value: tracks = [], loading: tracksLoading } = useCollectionData(tracksRef, null, 'id');

  const trackQuery = tracksRef && tracksRef.orderBy('timestamp', 'desc').limit(1);
  const { value: [track] = [], loading: trackLoading } = useCollectionData(trackQuery, null, 'id');

  const pickedTrackIDs = tracks.map(({ id }) => id);
  const pickedTracks = (possibleTracks || tracks).filter(({ id }) => pickedTrackIDs.includes(id));
  const unpickedTracks = (possibleTracks || []).filter(({ id }) => !pickedTrackIDs.includes(id));

  const loading = tracksLoading || trackLoading;

  return {
    tracksRef,
    pickedTracks,
    unpickedTracks,
    trackQuery,
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
  const player = track && track.players && track.players[playerID];
  if (player) {
    // give players a 'head start' in order to process the sounds
    const reactionTime = player.timestamp - track.timestamp - CHOICES_STARTUP; 
    const percent = Math.round(reactionTime / CHOICES_TIMEOUT * 100);
    const points = 100 - Math.min(Math.max(0, percent), 100);
    return points;
  }
  return null;
}

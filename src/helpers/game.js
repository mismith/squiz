import { useCollection, useCollectionData, useDocumentData } from 'react-firebase-hooks/firestore';
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

export function useLatestDocument(ref) {
  const query = ref && ref.orderBy('timestamp', 'desc').limit(1);
  const { value: { docs: [value] = [] } = {}, loading, error } = useCollection(query);

  return {
    value,
    loading,
    error,
  };
}

export function useTrack(roundRef, possibleTracks = []) {
  const tracksRef = roundRef && roundRef.collection('tracks');
  const { value: tracks = [], loading: tracksLoading } = useCollectionData(tracksRef, null, 'id');

  const { value: { ref: trackRef } = {}, loading: trackRefLoading } = useLatestDocument(tracksRef);
  const { value: track, loading: trackLoading } = useDocumentData(trackRef, null, 'id');

  const pickedTrackIDs = tracks.map(({ id }) => id);
  const pickedTracks = possibleTracks.filter(({ id }) => pickedTrackIDs.includes(id));
  const unpickedTracks = possibleTracks.filter(({ id }) => !pickedTrackIDs.includes(id));

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
  const player = track && track.players && track.players[playerID];
  if (player) {
    const playerSwipedAt = player.timestamp ? player.timestamp.toDate().getTime() : 0;
    const trackAcceptsSwipesAt = track.timestamp ? track.timestamp.toDate().getTime() : 0;
    // give players a 'head start' in order to process the visuals/sounds
    const reactionTime = playerSwipedAt - trackAcceptsSwipesAt - CHOICES_STARTUP; 
    const percent = Math.round(reactionTime / CHOICES_TIMEOUT * 100);
    const points = 100 - Math.min(Math.max(0, percent), 100);
    return points;
  }
  return null;
}

import SpotifyWebApi from 'spotify-web-api-js';
import weightedRandom from 'weighted-random';

export const spotify = new SpotifyWebApi();

export function toQueryString(obj) {
  return Object.entries(obj).map(([k, v]) => `${k}=${v}`).join('&');
}
export function fromQueryString(qs) {
  return Array.from(new URLSearchParams(qs)).reduce((obj, [k, v]) => ({
    ...obj,
    [k]: v,
  }), {});
}

export function login() {
  const params = {
    client_id: '8aaf2ce14c0f4937b5fa4fd90958d211',
    response_type: 'token',
    redirect_uri: window.location.origin,
  }
  window.location.href = `https://accounts.spotify.com/authorize?${toQueryString(params)}`;
}
export function retrieveAccessToken() {
  const { access_token } = fromQueryString(window.location.hash.substr(1));
  if (access_token) {
    window.localStorage.setItem('spotifyAccessToken', access_token);
    spotify.setAccessToken(access_token);
    window.location.hash = '';
  } else {
    spotify.setAccessToken(window.localStorage.getItem('spotifyAccessToken'));
  }
}

export async function loadCategories() {
  const { categories } = await spotify.getCategories({ limit: 50 });
  return categories.items;
}
export async function loadPlaylists(category) {
  if (category && category.id) {
    const { playlists } = await spotify.getCategoryPlaylists(category.id, { limit: 50 });
    return playlists.items;
  }
  return [];
}
export async function loadTracks(playlist) {
  if (playlist && playlist.id) {
    const { items } = await spotify.getPlaylistTracks(playlist.id);
    return items.map(({ track }) => track)
      .filter(track => track.name.length < 24)
      .filter(track => track.artists.map(({ name }) => name).join(', ').length < 24)
      .sort((a, b) => b.popularity - a.popularity);
  }
  return [];
}
export async function loadDecoys(track) {
  if (track && track.id) {
    const { tracks } = await spotify.getRecommendations({
      seed_tracks: track.id,
      seed_artists: track.artists.map(({ id }) => id),
    });
    return tracks
      .filter(decoy => decoy.name !== track.name)
      .filter(decoy => decoy.name.length < 24)
      .filter(decoy => decoy.artists.map(({ name }) => name).join(', ').length < 24)
      // .filter(decoy => !decoy.artists.find(a => track.artists.find(b => a.name === b.name)))
      // .filter((decoy, i, decoys) => !decoys.find(a => track.artists.find(b => a.name === b.name)))
      .sort((a, b) => b.popularity - a.popularity);
  }
  return [];
}

export function pickRandomTrack(tracks = []) {
  const weights = tracks.map(({ popularity }, index) => {
    const orderWeight = (tracks.length - index) / tracks.length * 50;
    return popularity + orderWeight;
  });
  const trackIndex = weightedRandom(weights);
  const track = tracks[trackIndex];
  return track;
}

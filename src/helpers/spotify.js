import SpotifyWebApi from 'spotify-web-api-js';

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

export function login(state) {
  const params = {
    client_id: '8aaf2ce14c0f4937b5fa4fd90958d211',
    response_type: 'token',
    redirect_uri: window.location.origin,
    state,
  }
  window.location.href = `https://accounts.spotify.com/authorize?${toQueryString(params)}`;
}
export function retrieveAccessToken() {
  const { access_token, state } = fromQueryString(window.location.hash.substr(1));
  let accessToken = access_token;
  if (accessToken) {
    window.localStorage.setItem('spotifyAccessToken', accessToken);
    spotify.setAccessToken(accessToken);
  } else {
    accessToken = window.localStorage.getItem('spotifyAccessToken');
    spotify.setAccessToken(accessToken);
  }
  return { accessToken, state };
}
retrieveAccessToken();

const handleAccessTokenExpired = (err) => {
  if (err && err.status === 401) {
    return login(window.location.pathname);
  }
  throw err;
};

export async function loadCategories() {
  const { categories } = await spotify.getCategories({ limit: 50 })
    .catch(handleAccessTokenExpired);

  return categories.items;
}
export async function loadPlaylists(categoryID) {
  const { playlists } = await spotify.getCategoryPlaylists(categoryID, { limit: 50 })
    .catch(handleAccessTokenExpired);

  return playlists.items;
}
export async function loadCategory(categoryID) {
  const category = await spotify.getCategory(categoryID)
    .catch(handleAccessTokenExpired);

  return category;
}
export async function loadPlaylist(playlistID) {
  const playlist = await spotify.getPlaylist(playlistID)
    .catch(handleAccessTokenExpired);

  return playlist;
}
export async function loadTracks(playlistID) {
  const { items } = await spotify.getPlaylistTracks(playlistID)
    .catch(handleAccessTokenExpired);

  return items.map(({ track }) => track)
    .filter(track => track.name.length < 24)
    .filter(track => track.artists.map(({ name }) => name).join(', ').length < 24)
    .sort((a, b) => b.popularity - a.popularity);
}
export async function loadDecoys(track) {
  const { tracks } = await spotify.getRecommendations({
    seed_tracks: track.id,
    seed_artists: track.artists.map(({ id }) => id),
  })
    .catch(handleAccessTokenExpired);

  return tracks
    .filter(decoy => decoy.name !== track.name)
    .filter(decoy => decoy.name.length < 24)
    .filter(decoy => decoy.artists.map(({ name }) => name).join(', ').length < 24)
    // .filter(decoy => !decoy.artists.find(a => track.artists.find(b => a.name === b.name)))
    // .filter((decoy, i, decoys) => !decoys.find(a => track.artists.find(b => a.name === b.name)))
    .sort((a, b) => b.popularity - a.popularity);
}

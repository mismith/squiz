import SpotifyWebApi from 'spotify-web-api-js';

const COUNTRY = 'CA';

export const spotify = new SpotifyWebApi();

export function toQueryString(obj) {
  return Object.entries(obj).map(([k, v]) => `${k}=${window.encodeURIComponent(v)}`).join('&');
}
export function fromQueryString(qs = window.location.search.substr(1)) {
  return Array.from(new URLSearchParams(qs)).reduce((obj, [k, v]) => {
    obj[k] = v;
    return obj;
  }, {});
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
  if (err?.status === 401) {
    return login(window.location.pathname);
  }
  throw err;
};
const handleAssetMissing = (err) => {
  if (err?.status === 404) {
    return undefined;
  }
  throw err;
};

const cache = {};
async function loadCached(getter, key) {
  if (cache[key] === undefined) {
    cache[key] = await getter();
  }
  return cache[key];
}

export async function loadCategories() {
  const categories = await loadCached(async () => {
    const response = await spotify.getCategories({ limit: 50, country: COUNTRY })
      .catch(handleAccessTokenExpired)
      .catch(handleAssetMissing);
  
    return response?.categories?.items || [];
  }, 'categories');
  const playlists = await Promise.all(
    categories.map(category => loadCategoryPlaylists(category.id))
  );
  return categories.filter((c, i) => playlists[i]?.length);
}
export async function loadCategoryPlaylists(categoryID) {
  return categoryID && loadCached(async () => {
    const response = await spotify.getCategoryPlaylists(categoryID, { limit: 50, country: COUNTRY })
      .catch(handleAccessTokenExpired)
      .catch(handleAssetMissing);
    
    return response?.playlists?.items || [];
  }, `playlists/${categoryID}`);
}
export async function loadCategory(categoryID) {
  return categoryID && loadCached(async () => {
    const category = await spotify.getCategory(categoryID, { country: COUNTRY })
      .catch(handleAccessTokenExpired);

    return category;
  }, `category/${categoryID}`);
}
export async function loadPlaylist(playlistID) {
  return playlistID && loadCached(async () => {
    const playlist = await spotify.getPlaylist(playlistID, { country: COUNTRY })
      .catch(handleAccessTokenExpired);

    return playlist;
  }, `playlist/${playlistID}`);
}
export async function loadPlaylistTracks(playlistID) {
  const tracks = playlistID ? await loadCached(async () => {
    const { items } = await spotify.getPlaylistTracks(playlistID, { country: COUNTRY })
      .catch(handleAccessTokenExpired);

    return items.map(({ track }) => track);
  }, `tracks/${playlistID}`) : [];

  return tracks
    .filter(track => track.name.length < 24)
    .filter(track => track.artists.map(({ name }) => name).join(', ').length < 24)
    .sort((a, b) => b.popularity - a.popularity);
}
export async function loadDecoys(track) {
  const decoys = track?.id ? await loadCached(async () => {
    const { tracks } = await spotify.getRecommendations({
      seed_tracks: track.id,
      seed_artists: track.artists.map(({ id }) => id),
      country: COUNTRY,
    })
      .catch(handleAccessTokenExpired);
    return tracks;
  }, `decoys/${track.id}`) : [];

  return decoys
    .filter(decoy => decoy.name !== track.name)
    .filter(decoy => decoy.name.length < 24)
    .filter(decoy => decoy.artists.map(({ name }) => name).join(', ').length < 24)
    // .filter(decoy => !decoy.artists.find(a => track.artists.find(b => a.name === b.name)))
    // .filter((decoy, i, decoys) => !decoys.find(a => track.artists.find(b => a.name === b.name)))
    .sort((a, b) => b.popularity - a.popularity);
}

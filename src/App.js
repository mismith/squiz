import React, { Component } from 'react';
import './App.css';
import SpotifyWebApi from 'spotify-web-api-js';
import weightedRandom from 'weighted-random';
import shuffleArray from 'shuffle-array';

const spotify = new SpotifyWebApi();
async function loadCategories() {
  const { categories } = await spotify.getCategories({ limit: 50 });
  return categories.items;
}
async function loadPlaylists(category) {
  const { playlists } = await spotify.getCategoryPlaylists(category.id, { limit: 50 });
  return playlists.items;
}
async function loadTracks(playlist) {
  const { items } = await spotify.getPlaylistTracks(playlist.id);
  return items.map(({ track }) => track)
    .filter(track => track.name.length < 24)
    .filter(track => track.artists.map(({ name }) => name).join(', ').length < 24)
    .sort((a, b) => b.popularity - a.popularity);
}
async function loadDecoys(track) {
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

function pickRandomTrack(tracks = []) {
  const weights = tracks.map(({ popularity }, index) => {
    const orderWeight = (tracks.length - index) / tracks.length * 50;
    return popularity + orderWeight;
  });
  const trackIndex = weightedRandom(weights);
  const track = tracks[trackIndex];
  return track;
}

const loadAndPlayAudio = (src, duration = 0) => {
  const audio = new Audio(src);
  audio.addEventListener('loadeddata', () => {
    audio.play();
  });
  if (duration) {
    setTimeout(() => {
      audio.pause();
    }, duration);
  }
  return audio;
};

const toQueryString = (obj) => {
  return Object.entries(obj).map(([k, v]) => `${k}=${v}`).join('&');
};
const fromQueryString = (qs) => {
  return Array.from(new URLSearchParams(qs)).reduce((obj, [k, v]) => ({
    ...obj,
    [k]: v,
  }), {});
};

class App extends Component {
  state = {
    categories: [],
    playlists: [],
    tracksPicked: [],
    tracks: [],
    decoys: [],
  };

  login() {
    const params = {
      client_id: '8aaf2ce14c0f4937b5fa4fd90958d211',
      response_type: 'token',
      redirect_uri: `${window.location.origin}${window.location.pathname}`,
    }
    window.location.href = `https://accounts.spotify.com/authorize?${toQueryString(params)}`;
  }
  retrieveAccessToken() {
    const { access_token } = fromQueryString(window.location.hash.substr(1));
    if (access_token) {
      window.localStorage.setItem('spotifyAccessToken', access_token);
      spotify.setAccessToken(access_token);
    } else {
      spotify.setAccessToken(window.localStorage.getItem('spotifyAccessToken'));
    }
  }

  async loadCategories() {
    this.setState({
      categories: await loadCategories(),
      playlists: [],
      tracksPicked: [],
      tracks: [],
      decoys: [],
    });
  }
  async loadPlaylists(category) {
    this.setState({
      playlists: await loadPlaylists(category),
      tracksPicked: [],
      tracks: [],
      decoys: [],
    });
  }
  async loadTracks(playlist) {
    this.setState({
      tracksPicked: [],
      tracks: await loadTracks(playlist),
      decoys: [],
    });
  }

  async nextTrack() {
    const track = pickRandomTrack(this.state.tracks);

    const decoys = await loadDecoys(track);
    const decoysPicked = [];
    while (decoysPicked.length < 3 && decoys.length) {
      const decoy = pickRandomTrack(decoys);
      const index = decoys.indexOf(decoy);
      decoysPicked.push(...decoys.splice(index, 1));
    }

    this.setState({
      tracks: this.state.tracks.filter(({ id }) => id !== track.id),
      tracksPicked: [
        ...this.state.tracksPicked,
        {
          ...track,
          decoys: decoysPicked,
        }
      ],
    });

    loadAndPlayAudio(track.preview_url, 10 * 1000);
  }

  async componentDidMount() {
    this.retrieveAccessToken();
    this.loadCategories();
  }

  render() {
    return (
      <div className="App">
        <button onClick={() => this.login()}>Login with Spotify</button>

        <div>
          {this.state.categories.map(category =>
            <button key={category.id} onClick={() => this.loadPlaylists(category)}>
              <img src={category.icons[0].url} alt="" />
              <div>{category.name}</div>
            </button>
          )}
        </div>
        <div>
          {this.state.playlists.map(playlist =>
            <button key={playlist.id} onClick={() => this.loadTracks(playlist)}>
              <img src={playlist.images[0].url} alt="" />
              <div>{playlist.name}</div>
            </button>
          )}
        </div>

        <ol>
          {this.state.tracks.map(track =>
            <li key={track.id} onClick={() => this.loadDecoys(track)}>
              {track.name}
              &nbsp;-&nbsp;
              {track.artists.map(artist => artist.name).join(', ')}
              &nbsp;-&nbsp;
              {track.popularity}
            </li>
          )}
        </ol>
        <ol>
          {this.state.tracksPicked.map(track =>
            <li key={track.id}>
              <div>
                {shuffleArray([track, ...track.decoys]).map(choice =>
                  <div key={choice.id}>{choice.name}</div>
                )}
              </div>
              
              {track.name}
              &nbsp;-&nbsp;
              {track.artists.map(artist => artist.name).join(', ')}
              &nbsp;-&nbsp;
              {track.popularity}

              <ul>
                {track.decoys.map(decoy =>
                  <li key={decoy.id}>
                    {decoy.name}
                    &nbsp;-&nbsp;
                    {decoy.artists.map(artist => artist.name).join(', ')}
                    &nbsp;-&nbsp;
                    {decoy.popularity}
                  </li>
                )}
              </ul>
            </li>
          )}
        </ol>

        <div>
          <button onClick={() => this.nextTrack()}>Next</button>
        </div>
      </div>
    );
  }
}

export default App;

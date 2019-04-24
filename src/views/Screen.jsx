import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Toolbar from '@material-ui/core/Toolbar';
import Card from '@material-ui/core/Card';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import SvgIcon from '@material-ui/core/SvgIcon';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import ArrowBackIosIcon from '@material-ui/icons/ArrowBackIos';
import ShuffleIcon from '@material-ui/icons/Shuffle';
import shuffleArray from 'shuffle-array';

import SpotifyButton from '../components/SpotifyButton';
import TileButton from '../components/TileButton';
import Choices from '../components/Choices';
import {
  login,
  retrieveAccessToken,
  loadCategories,
  loadPlaylists,
  loadTracks,
  loadDecoys,
  pickRandomTrack,
} from '../helpers/spotify';

const TIMEOUT_CHOICES = 10 * 1000;
const TIMEOUT_RESULTS = 3 * 1000;

const loadAndPlayAudio = (src) => {
  const audio = new Audio(src);
  audio.addEventListener('loadeddata', () => {
    audio.play();
  });
  audio.addEventListener('error', (err) => {
    console.error(err);
  });
  return audio;
};

const SpotifyLoginButton = (props) => {
  const Icon = <SvgIcon viewBox="0 0 167.49 167.49">
    <path d="M83.74,0C37.49,0,0,37.49,0,83.74c0,46.25,37.49,83.74,83.74,83.74c46.25,0,83.74-37.49,83.74-83.74
      C167.49,37.49,129.99,0,83.74,0z M122.15,120.79c-1.5,2.47-4.72,3.24-7.18,1.74c-19.67-12.02-44.42-14.73-73.57-8.07
      c-2.81,0.64-5.61-1.12-6.25-3.92c-0.64-2.81,1.11-5.61,3.93-6.25c31.9-7.29,59.26-4.15,81.34,9.33
      C122.88,115.11,123.65,118.33,122.15,120.79z M132.4,97.98c-1.89,3.07-5.91,4.04-8.98,2.15c-22.5-13.83-56.82-17.84-83.45-9.76
      c-3.45,1.04-7.1-0.9-8.15-4.35c-1.04-3.45,0.91-7.09,4.35-8.14c30.42-9.23,68.23-4.76,94.07,11.13
      C133.32,90.9,134.28,94.92,132.4,97.98z M133.28,74.24c-26.99-16.03-71.52-17.5-97.29-9.68c-4.14,1.26-8.51-1.08-9.77-5.22
      c-1.25-4.14,1.08-8.51,5.22-9.77c29.58-8.98,78.76-7.24,109.83,11.2c3.72,2.21,4.94,7.02,2.74,10.73
      C141.8,75.22,136.99,76.45,133.28,74.24z" />
  </SvgIcon>;
  return (
    <SpotifyButton icon={Icon} {...props}>
      Login with Spotify
    </SpotifyButton>
  );
};
const TileGrid = ({ children, style, ...props }) => (
  <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', padding: 8, ...style}} {...props}>
    {children}
  </div>
);

let audio;
let timeout;
export default (props) => {
  const [categories, setCategories] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [tracksUsed, setTracksUsed] = useState([]);
  const [showCorrect, setShowCorrect] = useState(false);

  const category = categories.find(({ id }) => id === props.categoryID);
  const playlist = playlists.find(({ id }) => id === props.playlistID);
  const track = tracksUsed[tracksUsed.length - 1];

  useEffect(() => {
    retrieveAccessToken();
    loadCategories().then(setCategories);
  }, []);

  useEffect(() => {
    loadPlaylists(category).then(setPlaylists);
    setTracks([]);
    setTracksUsed([]);
  }, [categories, props.categoryID]);

  useEffect(() => {
    loadTracks(playlist).then(setTracks);
    setTracksUsed([]);
  }, [playlists, props.playlistID]);

  async function nextTrack() {
    if (audio) audio.pause();
    if (timeout) window.clearTimeout(timeout);

    const newTrack = pickRandomTrack(tracks);

    const decoys = await loadDecoys(newTrack);
    const decoysUsed = [];
    while (decoysUsed.length < 3 && decoys.length) {
      const decoy = pickRandomTrack(decoys);
      const index = decoys.indexOf(decoy);
      decoysUsed.push(...decoys.splice(index, 1));
    }

    setShowCorrect(false);
    setTracks(tracks.filter(({ id }) => id !== newTrack.id));
    setTracksUsed([
      ...tracksUsed,
      {
        ...newTrack,
        $choices: shuffleArray([{
          ...newTrack,
          $isCorrect: true,
        }, ...decoysUsed]),
        $at: Date.now(),
      }
    ]);

    audio = loadAndPlayAudio(newTrack.preview_url);
    timeout = window.setTimeout(() => {
      endTrack();
    }, TIMEOUT_CHOICES);
  }

  async function endTrack(choice) {
    if (audio) audio.pause();
    if (timeout) window.clearTimeout(timeout);

    setShowCorrect(true);
    if (choice && track) {
      const isCorrect = choice.id === track.id;
      const reactionTime = Date.now() - track.$at - 500; // give me a 500ms head start
      const score = 100 - Math.max(0, Math.round(reactionTime / TIMEOUT_CHOICES * 100));
      console.log(isCorrect, score);
    }

    audio = null;
    timeout = window.setTimeout(() => {
      nextTrack();
    }, TIMEOUT_RESULTS);
  }

  function getRandomID(items = []) {
    const randomIndex = Math.floor(Math.random() * items.length);
    const randomItem = items[randomIndex];
    return randomItem && randomItem.id;
  }

  return (
    <div style={{display: 'flex', flexDirection: 'column', height: '100vh'}}>
      <Toolbar style={{justifyContent: 'center'}}>
        <SpotifyLoginButton onClick={() => login()} />
      </Toolbar>

      {!category &&
        <div>
          <Toolbar>
            <Button
              component={Link}
              to={`./screen/${getRandomID(categories)}`}
              style={{marginLeft: 'auto', marginRight: 'auto'}}
            >
              <ShuffleIcon style={{marginRight: 16}} />
              Random
            </Button>
          </Toolbar>
          <TileGrid>
            {categories.map(category =>
              <TileButton
                key={category.id}
                title={category.name}
                image={category.icons[0].url}
                component={Link}
                to={`./screen/${category.id}`}
              />
            )}
          </TileGrid>
        </div>
      }
      {category && !playlist &&
        <div>
          {!!playlists.length &&
            <Toolbar>
              <Button component={Link} to={'../screen'}>
                <ArrowBackIosIcon style={{marginRight: 8}} />
                Back
              </Button>
              <Button
                component={Link}
                to={`./${props.categoryID}/${getRandomID(playlists)}`}
                style={{marginLeft: 'auto', marginRight: 'auto'}}
              >
                <ShuffleIcon style={{marginRight: 16}} />
                Random
              </Button>
              <Button component={Link} to={'../screen'} style={{visibility: 'hidden'}}>
                {/* to even out whitespace and maintain random button horizontal centering */}
                <ArrowBackIosIcon />
                Back
              </Button>
            </Toolbar>
          }
          <TileGrid>
            {playlists.map(playlist =>
              <TileButton
                key={playlist.id}
                image={playlist.images[0].url}
                component={Link}
                to={`./${props.categoryID}/${playlist.id}`}
              />
            )}
          </TileGrid>
        </div>
      }
      {category && playlist && !track &&
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 'auto', position: 'relative', overflow: 'hidden'}}>
          <TileGrid style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', filter: 'blur(20px)', justifyContent: 'space-around', zIndex: 0}}>
            {tracks.map(choice =>
              <TileButton
                key={choice.id}
                image={choice.album.images[0].url}
                style={{margin: 0}}
              />
            )}
          </TileGrid>
          <Card raised style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 1}}>
            <Typography color="textSecondary" variant="subtitle1" component="h3">
              {category.name}
            </Typography>
            <Typography color="textPrimary" variant="h4" component="h1" style={{margin: 16}}>
              {playlist.name}
            </Typography>
            <SpotifyButton icon={<PlayArrowIcon />} style={{margin: 16}} onClick={nextTrack}>
              Start
            </SpotifyButton>
            <Button component={Link} to={`../${props.categoryID}`}>
              <ArrowBackIosIcon style={{marginRight: 8}} />
              Back
            </Button>
          </Card>
        </div>
      }

      {category && playlist && track &&
        <Choices
          choices={track.$choices}
          showCorrect={showCorrect}
          style={{flex: 'auto', overflow: 'hidden'}}
        />
      }
    </div>
  );
};

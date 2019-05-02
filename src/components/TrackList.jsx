import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useCollectionData, useDocumentData } from 'react-firebase-hooks/firestore';
import shuffleArray from 'shuffle-array';
import Card from '@material-ui/core/Card';
import Typography from '@material-ui/core/Typography';
import MobileStepper from '@material-ui/core/MobileStepper';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';

import TileGrid from './TileGrid';
import TileButton from './TileButton';
import SpotifyButton from './SpotifyButton';
import Choices from './Choices';
import Loader from './Loader';
import {
  retrieveAccessToken,
  loadCategory,
  loadPlaylist,
  loadTracks,
  loadDecoys,
} from '../helpers/spotify';
import {
  ROUNDS_LIMIT,
  TRACKS_LIMIT,
  CHOICES_TIMEOUT,
  RESULTS_TIMEOUT,
  pickRandomTrack,
  useTrack,
  trimTrack,
  getTrackPointsForPlayer,
} from '../helpers/game';

let audio;
let timeout;
const stop = () => {
  if (audio) {
    audio.pause();
    audio = null;
  }
  if (timeout) {
    window.clearTimeout(timeout);
    timeout = null;
  }
};
const loadAudio = src => new Promise((resolve, reject) => {
  const player = new Audio(src);
  player.addEventListener('loadeddata', () => {
    resolve(player);
  });
  player.addEventListener('error', (err) => {
    reject(err);
  });
});

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    flex: 'auto',
    position: 'relative',
    overflow: 'hidden',
  },
  bg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
    filter: 'blur(20px)',
    justifyContent: 'space-around',
    zIndex: 0,
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: '80%',
    padding: 16,
    margin: 'auto',
    zIndex: 1,
  },
  stepper: {
    justifyContent: 'center',
    zIndex: 1,
  },
};

export default ({ gameID, categoryID, playlistID: roundID, gameRef }) => {
  const [hasInteracted, setHasInteracted] = useState(false);
  const [category, setCategory] = useState();
  const [playlist, setPlaylist] = useState();
  const { value: game, loading: gameLoading } = useDocumentData(gameRef, null, 'id');
  const roundsRef = gameRef.collection('rounds');
  const { value: rounds, loading: roundsLoading } = useCollectionData(roundsRef);
  const roundRef = roundsRef.doc(roundID);
  const { value: round, loading: roundLoading } = useDocumentData(roundRef, null, 'id');
  const [possibleTracks, setPossibleTracks] = useState();
  const {
    tracksRef,
    pickedTracks,
    unpickedTracks,
    track,
    loading: trackLoading,
  } = useTrack(roundRef, possibleTracks);
  const loading = !category || !playlist || !possibleTracks
    || gameLoading || roundsLoading || roundLoading || trackLoading;
  const isInProgress = round && round.timestamp && !round.completed
    && game && game.timestamp && !game.completed;

  useEffect(() => {
    retrieveAccessToken();
  }, []);
  useEffect(() => {
    if (categoryID) {
      loadCategory(categoryID).then(setCategory);
    }
  }, [categoryID]);
  useEffect(() => {
    if (roundID) {
      loadPlaylist(roundID).then(setPlaylist);
      loadTracks(roundID).then(setPossibleTracks);
    }
  }, [roundID]);
  useEffect(() => {
    if (track && hasInteracted) {
      stop();

      // make sure the audio loads (skip track if not)
      loadAudio(track.src)
        .then((player) => {
          stop();

          player.play();

          // play a clip of the track, then show results
          timeout = window.setTimeout(() => {
            endTrack();
    
            timeout = window.setTimeout(() => {
              nextTrack();
            }, RESULTS_TIMEOUT);
          }, CHOICES_TIMEOUT);
        })
        .catch((err) => {
          console.warn(err); // eslint-disable-line no-console

          nextTrack(); // @TODO: replace the broken track instead of just missing it
        });
    }
    return () => stop();
  }, [track && track.id, hasInteracted]);

  async function nextTrack() {
    stop();

    if (pickedTracks.length >= TRACKS_LIMIT || !unpickedTracks.length) {
      return endRound();
    }

    const newTrack = pickRandomTrack(unpickedTracks);
    if (!newTrack) throw new Error('no more tracks'); // @TODO

    const decoys = await loadDecoys(newTrack);
    const decoysUsed = [];
    while (decoysUsed.length < 3 && decoys.length) {
      const decoy = pickRandomTrack(decoys);
      const index = decoys.indexOf(decoy);
      decoysUsed.push(...decoys.splice(index, 1));
    }

    const roundDoc = await roundRef.get();
    return Promise.all([
      // start a new round, if one isn't already started
      !roundDoc.exists && roundRef.set({
        timestamp: Date.now(),
      }),
      // add a new track to the round
      tracksRef.doc(newTrack.id).set({
        src: newTrack.preview_url,
        choices: shuffleArray([
          newTrack,
          ...decoysUsed,
        ].map(trimTrack)),
        timestamp: Date.now(),
      }),
    ]);
  }
  async function endTrack() {
    stop();

    if (!track) throw new Error('invalid track'); // @TODO

    const trackData = (await tracksRef.doc(track.id).get()).data() || {};
    await Promise.all([
      // mark the track as complete
      tracksRef.doc(track.id).set({
        completed: Date.now(),
      }, { merge: true }),
      // update all player scores
      ...Object.entries(trackData.players || {}).map(async ([playerID, response]) => {
        const isCorrect = track.id === response.choiceID;
        if (isCorrect) {
          const points = getTrackPointsForPlayer(trackData, playerID);
          const playerRef = gameRef.collection('players').doc(playerID);
          const { score } = (await playerRef.get()).data();
        console.log(isCorrect, track.id, response, score, points)
        return playerRef.set({
            score: (score || 0) + (points || 0),
          }, { merge: true });
        }
        return null;
      }),
    ]);
  }
  async function endRound() {
    await roundRef.set({
      completed: Date.now(),
    }, { merge: true });

    if (rounds.length >= ROUNDS_LIMIT) {
      return endGame();
    }
  }
  async function endGame() {
    await gameRef.set({
      completed: Date.now(),
    }, { merge: true });
  }
  async function handleNextClick() {
    // handle edge cases around playing and resuming current track
    if (!hasInteracted) {
      if (track) {
        if (track.completed) {
          // round is already over, so preload the next song before resuming
          await nextTrack();
        } else {
          // ensure start time is up-to-date (e.g. bump it to now if resuming a track)
          tracksRef.doc(track.id).set({
            timestamp: Date.now(),
          }, { merge: true });
        }
      }

      // ensure audio won't get blocked because of not being user-interction-driven
      setHasInteracted(true);

      if (!pickedTracks.length) {
        // it was a fresh page (re)load with no tracks played yet, so start
        nextTrack();
      }
    } else {
      // no edge cases: just go to the next track
      nextTrack();
    }
  }

  const body = useMemo(() => {
    if (loading) {
      return (
        <Loader />
      );
    }

    if (track && hasInteracted && isInProgress) {
      return (
        <Choices
          choices={track.choices}
          correctID={track.completed && track.id}
          style={{flex: 'auto', overflow: 'hidden'}}
        />
      );
    }

    const Content = () => {
      const CTA = () => {
        if (round && round.completed) {
          return (
            <>
              <TileGrid>
                {pickedTracks.map(track =>
                  <TileButton
                    key={track.id}
                    image={track.album.images[0].url}
                    size={64}
                  />
                )}
              </TileGrid>
              <SpotifyButton
                icon={<PlayArrowIcon />}
                style={{margin: 16}}
                component={Link}
                to={`/games/${gameID}`}
              >
                Next Round
              </SpotifyButton>
            </>
          );
        }

        return (
          <SpotifyButton
            icon={<PlayArrowIcon />}
            style={{margin: 16}}
            onClick={handleNextClick}
          >
            {!pickedTracks.length ? 'Start' : 'Resume'}
          </SpotifyButton>
        );
      };

      return (
        <Card raised style={styles.card}>
          <Typography color="textSecondary" variant="subtitle1">
            {category && category.name}
          </Typography>
          <Typography color="textPrimary" variant="h4" style={{margin: 16}}>
            {playlist && playlist.name}
          </Typography>

          <CTA />
        </Card>
      );
    };

    return (
      <div style={styles.container}>
        <TileGrid style={styles.bg}>
          {possibleTracks && possibleTracks.map(choice =>
            <TileButton
              key={choice.id}
              image={choice.album.images[0].url}
              style={{margin: 0}}
            />
          )}
        </TileGrid>

        <Content />
      </div>
    );
  }, [
    track && track.completed,
    hasInteracted,
    isInProgress,
    loading,
  ]);

  return (
    <>
      {body}

      {!loading && isInProgress &&
        <MobileStepper
          variant="dots"
          position="static"
          steps={TRACKS_LIMIT}
          activeStep={pickedTracks.length - 1}
          style={styles.stepper}
        />
      }
    </>
  );
};

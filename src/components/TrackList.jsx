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
import { usePromised } from '../helpers/util';
import { FieldValue } from '../helpers/firebase';
import {
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
  if (audio) {
    audio.pause();
    audio = null;
  }

  audio = new Audio(src);
  audio.addEventListener('loadeddata', () => {
    resolve(audio);
  });
  audio.addEventListener('error', (err) => {
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

  const [category, categoryLoading] = usePromised(() => loadCategory(categoryID), [categoryID]);
  const [playlist, playlistLoading] = usePromised(() => loadPlaylist(roundID), [roundID]);
  const [possibleTracks, possibleTracksLoading] = usePromised(() => loadTracks(roundID), [roundID]);

  const { value: game, loading: gameLoading } = useDocumentData(gameRef, null, 'id');
  const roundsRef = gameRef.collection('rounds');
  const { value: rounds, loading: roundsLoading } = useCollectionData(roundsRef);
  const roundRef = roundsRef.doc(roundID);
  const { value: round, loading: roundLoading } = useDocumentData(roundRef, null, 'id');
  const {
    tracksRef,
    pickedTracks,
    unpickedTracks,
    track,
    loading: trackLoading,
  } = useTrack(roundRef, possibleTracks);
  const loading = categoryLoading || playlistLoading || possibleTracksLoading
    || gameLoading || roundsLoading || roundLoading || trackLoading;
  const isInProgress = round && round.timestamp && !round.completed
    && game && game.timestamp && !game.completed;

  useEffect(() => {
    if (hasInteracted && track) {
      // make sure the audio loads (skip track if not)
      loadAudio(track.src)
        .then(() => {
          audio.play();

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
  }, [hasInteracted, track && track.id]);

  // store screen refresh/reload in state
  useEffect(() => {
    if (!hasInteracted && game && !game.paused) {
      // pause round until user interacts with screen
      gameRef.set({
        paused: FieldValue.serverTimestamp(),
      }, { merge: true });
  
      // reset/delete player responses
      if (track && !track.completed) {
        tracksRef.doc(track.id).set({
          players: FieldValue.delete(),
        }, { merge: true });
      }
    }
  }, [hasInteracted, game && game.id, track && track.id]);

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
        timestamp: FieldValue.serverTimestamp(),
      }),
      // add a new track to the round
      tracksRef.doc(newTrack.id).set({
        src: newTrack.preview_url,
        choices: shuffleArray([
          newTrack,
          ...decoysUsed,
        ].map(trimTrack)),
        timestamp: FieldValue.serverTimestamp(),
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
        completed: FieldValue.serverTimestamp(),
      }, { merge: true }),
      // update all player scores
      ...Object.entries(trackData.players || {}).map(async ([playerID, response]) => {
        const isCorrect = track.id === response.choiceID;
        if (isCorrect) {
          const points = getTrackPointsForPlayer(trackData, playerID);
          const playerRef = gameRef.collection('players').doc(playerID);
          const { score } = (await playerRef.get()).data();

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
      completed: FieldValue.serverTimestamp(),
    }, { merge: true });

    if (rounds.length >= ROUNDS_LIMIT) {
      return endGame();
    }
  }
  async function endGame() {
    await gameRef.set({
      completed: FieldValue.serverTimestamp(),
    }, { merge: true });
  }
  async function handleNextClick() {
    // handle edge cases around playing and resuming current track
    if (!hasInteracted) {
      if (track) {
        if (track.completed) {
          // round is already over, so switch to the next song before resuming
          await nextTrack();
        } else {
          // ensure start time is up-to-date (e.g. bump it to now if resuming a track)
          tracksRef.doc(track.id).set({
            timestamp: FieldValue.serverTimestamp(),
          }, { merge: true });
        }
      }

      // ensure audio won't get blocked because of not being user-interction-driven
      setHasInteracted(true);

      // unpause
      gameRef.set({
        paused: FieldValue.delete(),
      }, { merge: true });

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
    !loading && category && category.id,
    !loading && playlist && playlist.id,
    !loading && round && round.id,
    !loading && track && track.id,
    !loading && track && track.completed,
    !loading && hasInteracted,
    !loading && isInProgress,
  ]);

  if (loading) {
    return (
      <Loader />
    );
  }

  return (
    <>
      {body}

      {isInProgress &&
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

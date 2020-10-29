import React, { useState, useEffect, useMemo } from 'react';
import { useCollectionData, useDocumentData } from 'react-firebase-hooks/firestore';
import useLocalStorage from 'react-use-localstorage';
import { useAsync } from 'react-async-hook';
import shuffleArray from 'shuffle-array';
import Card from '@material-ui/core/Card';
import Typography from '@material-ui/core/Typography';
import Tooltip from '@material-ui/core/Tooltip';
import MobileStepper from '@material-ui/core/MobileStepper';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';

import TileGrid from './TileGrid';
import TileButton from './TileButton';
import SpotifyButton from './SpotifyButton';
import Choices from './Choices';
import Loader from './Loader';
import { FieldValue } from '../helpers/firebase';
import {
  loadCategory,
  loadPlaylist,
  loadPlaylistTracks,
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
  useLatestDocument,
  endGame as endGameHelper,
} from '../helpers/game';
import * as audio from '../helpers/audio';

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

export default ({ categoryID, playlistID, gameRef }) => {
  const {
    result: category,
    loading: categoryLoading,
  } = useAsync(() => loadCategory(categoryID), [categoryID]);
  const {
    result: playlist,
    loading: playlistLoading,
  } = useAsync(() => loadPlaylist(playlistID), [playlistID]);
  const {
    result: tracks,
    loading: tracksLoading,
  } = useAsync(() => loadPlaylistTracks(playlistID), [playlistID]);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [usedTrackIDs, setUsedTrackIDs] = useLocalStorage('usedTracks', '');

  const { value: game, loading: gameLoading } = useDocumentData(gameRef, null, 'id');
  const roundsRef = gameRef.collection('rounds');
  const { value: rounds, loading: roundsLoading } = useCollectionData(roundsRef);
  const { value: { ref: roundRef } = {}, loading: roundRefLoading } = useLatestDocument(roundsRef);
  const { value: round, loading: roundLoading } = useDocumentData(roundRef, null, 'id');
  const {
    tracksRef,
    pickedTracks,
    unpickedTracks,
    track,
    loading: trackLoading,
  } = useTrack(roundRef, tracks, usedTrackIDs.split(','));

  const loading = categoryLoading || playlistLoading || tracksLoading
    || gameLoading || roundsLoading || roundRefLoading || roundLoading || trackLoading;
  const isInProgress = game?.timestamp && !game.completed && round?.timestamp && !round.completed;
  const isPlaylistThisRounds = round?.playlistID === playlistID;
  const isPlaylistInProgress = isPlaylistThisRounds && !round.completed;
  const isPlaylistLastCompleted = isPlaylistThisRounds && round.completed;
  const isPlaylistAlreadyPlayed = rounds && round && rounds.some(r => r.playlistID === playlistID);

  async function endGame() {
    audio.stop();

    await endGameHelper(gameRef);
  }
  async function endRound() {
    audio.stop();

    await roundRef.set({
      completed: FieldValue.serverTimestamp(),
    }, { merge: true });
  }
  async function endTrack() {
    audio.stop();

    await tracksRef.doc(track.id).set({
      completed: FieldValue.serverTimestamp(),
    }, { merge: true });
  }

  const nextTrack = async () => {
    const pickedTrack = pickRandomTrack(unpickedTracks);
    if (!pickedTrack) throw new Error('no more tracks'); // @TODO

    const decoys = await loadDecoys(pickedTrack);
    const decoysUsed = [];
    while (decoysUsed.length < 3 && decoys.length) {
      const decoy = pickRandomTrack(decoys);
      const index = decoys.indexOf(decoy);
      decoysUsed.push(...decoys.splice(index, 1));
    }

    // start a new round, if one isn't already started, or if existing one is already completed
    let trackRoundRef = roundRef;
    if (!round || (round && round.completed)) {
      trackRoundRef = await roundsRef.add({
        playlistID,
        timestamp: FieldValue.serverTimestamp(),
      });
    }

    // append trimmed track to round's list
    const newTrack = {
      src: pickedTrack.preview_url || 'missing',
      choices: shuffleArray([
        pickedTrack,
        ...decoysUsed,
      ].map(trimTrack)),
      timestamp: FieldValue.serverTimestamp(),
    };
    setUsedTrackIDs(`${usedTrackIDs ? `${usedTrackIDs},` : ''}${pickedTrack.id}`);
    await trackRoundRef.collection('tracks').doc(pickedTrack.id).set(newTrack);
  };
  const next = async () => {
    audio.stop();

    if (pickedTracks && pickedTracks.length >= TRACKS_LIMIT) {
      if (round && !round.completed) {
        // @TODO: alert if track run out early
        await endRound();

        if (rounds && rounds.length >= ROUNDS_LIMIT) {
          // @TODO: make this non-instant
          if (game && !game.completed) {
            await endGame();
          }
        }
        return;
      }
    }

    await nextTrack();
  };
  const handleNextClick = async () => {
    if (game.completed) {
      return; // @TODO
    }

    if (game.paused) {
      // unpause/resume
      await gameRef.set({
        paused: FieldValue.delete(),
      }, { merge: true });
    }

    // resuming a track (e.g. after page refresh)
    if (track && !track.completed) {
      // ensure start time is up-to-date, and clear any existing player responses
      await tracksRef.doc(track.id).set({
        players: FieldValue.delete(),
        timestamp: FieldValue.serverTimestamp(),
      }, { merge: true });
    } else {
      // playing a track as usual
      await next();
    }

    // ensure audio doesn't get blocked because of not being user-interction-driven
    // NB: this goes last since the state change triggers UI updates
    if (!hasInteracted) {
      setHasInteracted(true);
    }
  };

  // store screen refresh/reload in state // @TODO: move this to page beforeunload
  useEffect(() => {
    if (!hasInteracted && !game?.paused) {
      // pause round until user interacts with screen
      gameRef.set({
        paused: FieldValue.serverTimestamp(),
      }, { merge: true });
    }
  }, [hasInteracted, game?.id]);
  useAsync(async () => {
    // make sure the audio loads (skip track if not)
    try {
      if (hasInteracted && track?.src && !track.completed) {
        await audio.play(track.src);

        // play a clip of the track (e.g. stop playing it early, before it actually ends)
        await new Promise((resolve) => {
          audio.setTimeout(resolve, CHOICES_TIMEOUT);
        });
        await endTrack();
      }
    } catch (err) {
      console.warn(err); // eslint-disable-line no-console

      await next();
      // @TODO: replace the broken track instead of just missing it
      // e.g. remove broken track -> nextTrack()
    }
  }, [hasInteracted, track?.src]);
  useAsync(async () => {
    if (hasInteracted && track?.completed) {
      // update all player scores
      await Promise.all(Object.entries(track.players || {}).map(async ([playerID, response]) => {
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

      // show results
      await new Promise((resolve) => {
        audio.setTimeout(resolve, RESULTS_TIMEOUT);
      });
      await next();
    }
  }, [hasInteracted, track?.completed]);

  const body = useMemo(() => {
    if (track && hasInteracted && isInProgress) {
      return (
        <Choices
          choices={track.choices}
          correctID={track.completed && track.id}
          style={{ flex: 'auto', overflow: 'hidden' }}
        />
      );
    }

    return (
      <div style={styles.container}>
        <TileGrid style={styles.bg}>
          {tracks && tracks.map(choice =>
            <TileButton
              key={choice.id}
              image={choice.album.images[0].url}
              style={{ margin: 0 }}
            />
          )}
        </TileGrid>

        <Card raised style={styles.card}>
          <Typography color="textSecondary" variant="subtitle1">
            {category && category.name}
          </Typography>
          <Typography color="textPrimary" variant="h4" style={{ margin: 16 }}>
            {playlist && playlist.name}
          </Typography>

          {isPlaylistLastCompleted &&
            <TileGrid>
              {pickedTracks.map(track =>
                <Tooltip
                  key={track.id}
                  title={`${track.name} by ${track.artists.map(({ name }) => name).join(', ')}`}
                >
                  <TileButton
                    image={track.album.images[0].url}
                    size={64}
                    onMouseEnter={() => audio.play(track.preview_url)}
                    onMouseLeave={() => audio.stop()}
                  />
                </Tooltip>
              )}
            </TileGrid>
          }

          <SpotifyButton
            icon={<PlayArrowIcon />}
            style={{ margin: 16 }}
            onClick={handleNextClick}
          >
            {isPlaylistInProgress ? 'Resume' : `Play${isPlaylistAlreadyPlayed ? ' Again' : ''}`}
          </SpotifyButton>
        </Card>
      </div>
    );
  }, [
    !loading && category?.id,
    !loading && playlist?.id,
    !loading && round?.id,
    !loading && track?.id,
    !loading && track?.completed,
    !loading && hasInteracted,
    !loading && isInProgress,
    !loading && pickedTracks,
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

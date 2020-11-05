import React, { useState, useEffect } from 'react';
import { useRouteMatch } from 'react-router-dom';
import { useAsync } from 'react-async-hook';
import useLocalStorage from 'react-use-localstorage';
import { useCollectionData, useDocumentData } from 'react-firebase-hooks/firestore';
import shuffleArray from 'shuffle-array';
import Card from '@material-ui/core/Card';
import Typography from '@material-ui/core/Typography';
import Tooltip from '@material-ui/core/Tooltip';
import { makeStyles } from '@material-ui/core/styles';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';

import TileGrid from './TileGrid';
import TileButton from './TileButton';
import SpotifyButton from './SpotifyButton';
import Choices from './Choices';
import Loader from './Loader';
import { firestore, FieldValue } from '../helpers/firebase';
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
  useLatestDocument,
  scorePlayerResponses,
  endGame,
  endRound,
  endTrack,
  resumeGame,
  pauseGame,
} from '../helpers/game';
import * as audio from '../helpers/audio';

const useStyles = makeStyles(theme => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    flex: 'auto',
    position: 'relative',
  },
  bg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
    filter: 'blur(20px)',
    justifyContent: 'space-between',
    overflow: 'hidden',
    zIndex: 0,
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: '80%',
    padding: theme.spacing(2),
    margin: 'auto',
    zIndex: 1,
  },
  stepper: {
    justifyContent: 'center',
    zIndex: 1,
  },
}));

export default function TrackList() {
  const classes = useStyles();
  const { params: { gameID, categoryID, playlistID, } } = useRouteMatch();
  const gameRef = firestore.collection('games').doc(gameID);

  const {
    result: category,
    loading: categoryLoading,
  } = useAsync(loadCategory, [categoryID]);
  const {
    result: playlist,
    loading: playlistLoading,
  } = useAsync(loadPlaylist, [playlistID]);
  const {
    result: tracks,
    loading: tracksLoading,
  } = useAsync(loadPlaylistTracks, [playlistID]);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [usedTrackIDs, setUsedTrackIDs] = useLocalStorage('usedTracks', '');

  const { value: game, loading: gameLoading } = useDocumentData(gameRef, null, 'id');
  const playersRef = gameRef.collection('players');
  const { value: players, loading: playersLoading } = useCollectionData(playersRef);
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

  const loading = categoryLoading || playlistLoading || tracksLoading || playersLoading
    || gameLoading || roundsLoading || roundRefLoading || roundLoading || trackLoading;
  const isInProgress = game?.timestamp && !game?.completed && round?.timestamp && !round?.completed;
  const isPlaylistThisRounds = round?.playlistID === playlistID;
  const isPlaylistInProgress = isPlaylistThisRounds && !round?.completed;
  const isPlaylistLastCompleted = isPlaylistThisRounds && round?.completed;
  const isPlaylistAlreadyPlayed = round && rounds?.some(r => r.playlistID === playlistID);

  const nextTrack = async () => {
    const pickedTrack = pickRandomTrack(unpickedTracks);
    if (!pickedTrack) throw new Error('no more tracks'); // @TODO
    if (!(await audio.load(pickedTrack.preview_url))) return nextTrack();

    const decoys = await loadDecoys(pickedTrack);
    const decoysUsed = [];
    while (decoysUsed.length < 3 && decoys.length) {
      const decoy = pickRandomTrack(decoys);
      const index = decoys.indexOf(decoy);
      decoysUsed.push(...decoys.splice(index, 1));
    }

    // start a new round, if one isn't already started, or if existing one is already completed
    let trackRoundRef = roundRef;
    if (!round || round?.completed) {
      trackRoundRef = await roundsRef.add({
        playlistID,
        timestamp: FieldValue.serverTimestamp(),
      });
    }

    // append trimmed track to round's list
    const newTrack = {
      src: pickedTrack.preview_url,
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

    if (pickedTracks?.length >= TRACKS_LIMIT || !unpickedTracks?.length) {
      if (!round?.completed) {
        // @TODO: alert if track run out early
        await endRound(roundRef);

        if (rounds?.length >= ROUNDS_LIMIT) {
          // @TODO: make this non-instant
          if (!game?.completed) {
            await endGame(gameRef);
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
      await resumeGame(gameRef);
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
  };
  const handleClick = () => {
    // ensure audio doesn't get blocked because of not being user-interction-driven
    // NB: this goes last since the state change triggers UI updates
    if (!hasInteracted) {
      setHasInteracted(true);
    }
  };

  // stop audio when leaving page
  useEffect(() => {
    return () => audio.stop();
  }, []);
  // store screen refresh/reload in state // @TODO: move this to page beforeunload
  useEffect(() => {
    if (!hasInteracted && !game?.paused) {
      // pause round until user interacts with screen
      pauseGame(gameRef);
    }
  }, [hasInteracted, game?.id]);
  useAsync(async () => {
    // make sure the audio loads (skip track if not)
    try {
      if (hasInteracted && track?.src && !track.completed && !game?.paused) {
        await audio.play(track.src);

        // play a clip of the track (e.g. stop playing it early, before it actually ends)
        await new Promise((resolve) => {
          audio.setTimeout(resolve, CHOICES_TIMEOUT);
        });
        await endTrack(tracksRef.doc(track.id));
      }
    } catch (err) {
      console.warn(err); // eslint-disable-line no-console

      await next();
      // @TODO: replace the broken track instead of just missing it
      // e.g. remove broken track -> nextTrack()
    }
  }, [hasInteracted, track?.src, game?.paused]);
  useAsync(async () => {
    if (hasInteracted && track?.completed && !game?.paused) {
      // update all player scores
      await scorePlayerResponses(gameRef, track);

      // show results
      await new Promise((resolve) => {
        audio.setTimeout(resolve, RESULTS_TIMEOUT);
      });
      await next();
    }
  }, [hasInteracted, track?.completed, game?.paused]);

  if (loading) {
    return (
      <Loader />
    );
  }
  if (track && hasInteracted && isInProgress && !game?.paused) {
    return (
      <Choices
        choices={track.choices}
        correctID={track.completed && track.id}
        style={{ flex: 'auto', overflow: 'hidden' }}
      />
    );
  }
  return (
    <div className={classes.root} onClick={handleClick}>
      <TileGrid className={classes.bg}>
        {tracks && tracks.map(choice =>
          <TileButton
            key={choice.id}
            image={choice.album.images[0].url}
            style={{ margin: 0 }}
          />
        )}
      </TileGrid>

      <Card raised className={classes.card}>
        <Typography color="textSecondary" variant="subtitle1">
          {category?.name}
        </Typography>
        <Typography color="textPrimary" variant="h4" style={{ margin: 16 }}>
          {playlist?.name}
        </Typography>

        {isPlaylistLastCompleted && (
          <TileGrid>
            {pickedTracks.map(track =>
              <Tooltip
                key={track.id}
                title={`${track.name} by ${track.artists.map(({ name }) => name).join(', ')}`}
              >
                <TileButton
                  image={track.album.images[0].url}
                  size={64}
                  onMouseEnter={() => hasInteracted && audio.play(track.preview_url)}
                  onMouseLeave={() => hasInteracted && audio.stop()}
                />
              </Tooltip>
            )}
          </TileGrid>
        )}

        <SpotifyButton
          icon={<PlayArrowIcon />}
          style={{ margin: 16 }}
          disabled={!players?.length || Boolean(!unpickedTracks?.length && round?.completed)}
          onClick={handleNextClick}
        >
          {isPlaylistInProgress ? 'Resume' : `Play${isPlaylistAlreadyPlayed ? ' Again' : ''}`}
        </SpotifyButton>
      </Card>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useAsync } from 'react-async-hook';
import useAsyncEffect from 'use-async-effect';
import { useListVals, useObjectVal } from 'react-firebase-hooks/database';
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
import useRouteParams from '../hooks/useRouteParams';
import useHasInteracted from '../hooks/useHasInteracted';
import { SETTINGS } from '../helpers/settings';
import { refs, keyField, ServerValue, useLatestObjectVal } from '../helpers/firebase';
import {
  loadCategory,
  loadPlaylist,
  loadPlaylistTracks,
  loadDecoys,
} from '../helpers/spotify';
import {
  pickRandomTrack,
  usePickedTracks,
  trimTrack,
  endGame,
  endRound,
  endTrack,
  resumeGame,
  startRound,
  restartTrack,
  useUsedTrackIDs,
} from '../helpers/game';
import * as audio from '../helpers/audio';

const useStyles = makeStyles(theme => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    flex: 'auto',
    position: 'relative',
    transition: ({ startingDuration: ms }) => `opacity ${ms}ms cubic-bezier(0.55, 0, 0, 1)`,
  },
  starting: {
    opacity: 0,
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
  const startingDuration = 4 * 1000;
  const classes = useStyles({ startingDuration });

  const hasInteracted = useHasInteracted();
  
  const { ROUNDS_LIMIT, TRACKS_LIMIT, CHOICES_TIMEOUT, RESULTS_TIMEOUT } = SETTINGS;
  const { gameID, categoryID, playlistID } = useRouteParams();
  const {
    result: category,
    loading: categoryLoading,
  } = useAsync(loadCategory, [categoryID]);
  const {
    result: playlist,
    loading: playlistLoading,
  } = useAsync(loadPlaylist, [playlistID]);
  const {
    result: playlistTracks,
    loading: playlistTracksLoading,
  } = useAsync(loadPlaylistTracks, [playlistID]);
  const [usedTrackIDs, setUsedTrackIDs] = useUsedTrackIDs();
  const [isStarting, setStarting] = useState(false);

  const [game, gameLoading] = useObjectVal(refs.game(gameID), { keyField });
  const [rounds, roundsLoading] = useListVals(refs.rounds(gameID), { keyField });
  const [players, playersLoading] = useListVals(refs.players(gameID), { keyField });
  const [round, roundLoading] = useLatestObjectVal(refs.rounds(gameID), { keyField });
  const roundID = round?.id;
  const [track, trackLoading] = useLatestObjectVal(roundID && refs.tracks(roundID), { keyField });
  const trackID = track?.id;

  const {
    pickedTracks,
    unpickedTracks,
    loading: pickedTracksLoading,
  } = usePickedTracks(roundID, playlistTracks, usedTrackIDs.split(','));

  const loading = categoryLoading || playlistLoading || playlistTracksLoading || playersLoading
    || pickedTracksLoading || gameLoading || roundsLoading || roundLoading || trackLoading;
  const isInProgress = game?.timestamp && !game?.completed && round?.timestamp && !round?.completed;
  const isPlaylistThisRounds = round?.playlistID === playlistID;
  const isPlaylistInProgress = isPlaylistThisRounds && !round?.completed;
  const isPlaylistLastCompleted = isPlaylistThisRounds && round?.completed;
  const isPlaylistAlreadyPlayed = round && rounds?.some(r => r.playlistID === playlistID);
  const hasEnoughPlayers = players?.length > 0;
  const hasEnoughTracksRemaining = unpickedTracks?.length >= TRACKS_LIMIT - pickedTracks?.length;

  const nextTrack = async () => {
    const pickedTrack = pickRandomTrack(unpickedTracks);
    if (!pickedTrack) {
      throw new Error('no more tracks'); // @TODO
    } else {
      setUsedTrackIDs(`${usedTrackIDs ? `${usedTrackIDs},` : ''}${pickedTrack.id}`);
    }

    if (pickedTrack.preview_url && !(await audio.loadSound(pickedTrack.preview_url))) {
      return nextTrack();
    }

    const decoys = await loadDecoys(pickedTrack);
    if (decoys.length < 3) {
      return nextTrack();
    }

    const decoysUsed = [];
    while (decoysUsed.length < 3) {
      const decoy = pickRandomTrack(decoys);
      const index = decoys.indexOf(decoy);
      decoysUsed.push(...decoys.splice(index, 1));
    }

    // start a new round, if one isn't already started, or if existing one is already completed
    let trackRoundID = roundID;
    if (!round || round?.completed) {
      ({ key: trackRoundID } = await startRound(gameID, playlistID));
    }

    // append trimmed track to round's list
    const newTrack = {
      correctID: pickedTrack.id,
      src: pickedTrack.preview_url,
      choices: shuffleArray([
        pickedTrack,
        ...decoysUsed,
      ].map(trimTrack)),
      timestamp: ServerValue.TIMESTAMP,
    };
    // @TODO: avoid/prevent duplicates, and maybe also avoid leaks by trimming this?
    await refs.tracks(trackRoundID).push(newTrack);
  };
  const next = async () => {
    audio.stop();

    if (pickedTracks?.length >= TRACKS_LIMIT || !hasEnoughTracksRemaining) {
      if (!round?.completed) {
        // @TODO: alert if track run out early
        await endRound(gameID, roundID);

        if (rounds?.length >= ROUNDS_LIMIT) {
          // @TODO: make this non-instant
          if (!game?.completed) {
            await endGame(gameID);
            audio.playSound(audio.SOUNDS.END);
          }
        }
        return;
      }
    }

    await nextTrack();
  };
  const handleNextClick = async () => {
    if (game.completed || isStarting) {
      return; // @TODO
    }

    // wait for a bit before starting to give the game master time to get their device
    setStarting(true);
    await audio.play(audio.SOUNDS.START, false);
    await new Promise((resolve) => {
      audio.setTimeout(resolve, startingDuration);
    });

    // unpause/resume
    if (game.paused) {
      await resumeGame(gameID);
    }

    // resuming a track (e.g. after page refresh)
    if (trackID && !track?.completed) {
      // ensure start time is up-to-date, and clear any existing player responses
      await restartTrack(roundID, trackID);
    } else {
      // playing a track as usual
      await next();
    }
    setStarting(false);
  };

  // stop audio when leaving page
  useEffect(() => {
    return () => audio.stop();
  }, []);
  useAsyncEffect(async (isMounted) => {
    // make sure the audio loads (skip track if not)
    try {
      if (hasInteracted && track?.src && !track.completed && !game?.paused) {
        await audio.play(track.src);
        if (!isMounted()) return;

        // play a clip of the track (e.g. stop playing it early, before it actually ends)
        await new Promise((resolve) => {
          audio.setTimeout(resolve, CHOICES_TIMEOUT);
        });
        if (!isMounted()) return;
        await endTrack(roundID, track.id);
      }
    } catch (err) {
      console.warn(err); // eslint-disable-line no-console

      await next();
      // @TODO: replace the broken track instead of just missing it
      // e.g. remove broken track -> nextTrack()
    }
  }, [hasInteracted, track?.src, game?.paused]);
  useAsyncEffect(async (isMounted) => {
    if (hasInteracted && track?.completed && !game?.paused) {
      // show results
      await new Promise((resolve) => {
        audio.setTimeout(resolve, RESULTS_TIMEOUT);
      });
      if (!isMounted()) return;
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
        correctID={track.completed && track.correctID}
        style={{ flex: 'auto' }}
      />
    );
  }
  return (
    <div className={`${classes.root} ${isStarting ? classes.starting : ''}`}>
      <TileGrid className={classes.bg}>
        {playlistTracks?.map(choice =>
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
          icon={isStarting ? null : <PlayArrowIcon />}
          color={isStarting ? 'secondary' : 'primary'}
          style={{ margin: 16 }}
          disabled={!hasEnoughPlayers || !hasEnoughTracksRemaining || Boolean(game?.completed)}
          onClick={handleNextClick}
        >
          {isStarting ? (
            'Get Ready!'
          ) : (
            isPlaylistInProgress ? 'Resume' : `Play${isPlaylistAlreadyPlayed ? ' Again' : ''}`
          )}
        </SpotifyButton>
        {!hasEnoughPlayers && (
          <Typography variant="caption" color="error">
            At least one player needed
          </Typography>
        )}
        {!hasEnoughTracksRemaining && (
          <Typography variant="caption" color="error">
            Not enough unplayed tracks remaining
          </Typography>
        )}
      </Card>
    </div>
  );
};

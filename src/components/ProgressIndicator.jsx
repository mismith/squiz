import React from 'react';
import { useCollection, useCollectionData, useDocumentData } from 'react-firebase-hooks/firestore';
import Tooltip from '@material-ui/core/Tooltip';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';

import TileButton from './TileButton';
import {
  ROUNDS_LIMIT,
  TRACKS_LIMIT,
  useGame,
} from '../helpers/game';
import * as audio from '../helpers/audio';
import useHasInteracted from '../hooks/useHasInteracted';

const useStyles = makeStyles(theme => ({
  root: {
    display: 'flex',
    flexWrap: 'nowrap',
    height: theme.spacing(0.5),
    width: '100%',
  },
  round: {
    display: 'flex',
    flex: 'auto',
    backgroundColor: theme.palette.text.disabled,
    '&:not(:last-child)': {
      borderRight: 'solid 2px black',
    },
    '&.active:not(:hover) $track': {
      borderRightColor: 'transparent',
    },
  },
  wrapper: {
    display: 'flex',
    flex: 'auto',
    height: theme.spacing(3.5),
    padding: theme.spacing(1.5, 0),
    margin: theme.spacing(-1.5, 0),
    cursor: 'pointer',
    '&:not(:last-child) $track': {
      borderRight: 'solid 1px black',
    },
  },
  track: {
    display: 'flex',
    width: '100%',
    height: '100%',
    backgroundColor: theme.palette.text.disabled,
    transition: 'border 300ms',
    '&.active': {
      backgroundColor: theme.palette.primary.main,
    },
  },
  step: {
    backgroundColor: theme.palette.primary.main,
  },
}));

function ChoicePreview({ choice, ...props }) {
  const title = `${choice?.name} by ${choice?.artists.map(({ name }) => name).join(', ')}`;
  return (
    <Grid
      container
      direction="column"
      alignItems="center"
      {...props}
    >
      <TileButton
        image={choice?.album?.image}
        style={{ pointerEvents: 'none' }}
      />
      <Typography variant="body2" style={{ marginBottom: 8 }}>
        {title}
      </Typography>
    </Grid>
  );
}

function TrackProgress({ tracks, j, ...props }) {
  const classes = useStyles();

  const hasInteracted = useHasInteracted();

  const track = tracks?.[j - 1];
  const choice = track?.choices?.find(({ id }) => id === track?.id);
  const isActive = j < tracks?.length || !!track?.completed;

  const [{ value: game }] = useGame();
  const progress = audio.useProgress();
  const isInProgress = !game?.paused && j === tracks?.length;
  const width = `${isActive ? 100 : (isInProgress ? progress : 0)}%`;

  return (
    <Tooltip
      title={isActive ? <ChoicePreview choice={choice} /> : ''}
      interactive
      placement="top"
      {...props}
    >
      <div
        className={classes.wrapper}
        onMouseEnter={() => isActive && hasInteracted && !audio.isPlaying() && audio.play(track?.src, false)}
        onMouseLeave={() => isActive && hasInteracted && !audio.isPlaying() && audio.stop(false, false)}
      >
        <div className={`${classes.track} ${isActive ? 'active' : ''}`}>
          <div className={classes.step} style={{ width }} />
        </div>
      </div>
    </Tooltip>
  );
}

function RoundProgress({ rounds, i, className, ...props }) {
  const classes = useStyles();

  const tracksNum = Array.apply(null, { length: TRACKS_LIMIT }).map((v, i) => i + 1);

  const roundRef = rounds?.[i - 1]?.ref;
  const { value: round } = useDocumentData(roundRef, null, 'id');
  const isActive = i < rounds?.length || (i === rounds?.length && round?.completed);
  const tracksQuery = roundRef?.collection('tracks').orderBy('timestamp', 'asc');
  const { value: tracks } = useCollectionData(tracksQuery, null, 'id');

  return (
    <div className={`${classes.round} ${isActive ? 'active' : ''} ${className || ''}`} {...props}>
      {i <= rounds?.length && tracksNum.map(j => (
        <TrackProgress key={j} tracks={tracks} j={j} />
      ))}
    </div>
  );
}

export default function ProgressIndicator({ className, ...props }) {
  const classes = useStyles();
  
  const roundsNum = Array.apply(null, { length: ROUNDS_LIMIT }).map((v, i) => i + 1);

  const [, gameRef] = useGame();
  const roundsQuery = gameRef.collection('rounds').orderBy('timestamp', 'asc');
  const { value: { docs: rounds = [] } = {} } = useCollection(roundsQuery);

  return (
    <div
      className={`${classes.root} ${className || ''}`}
      {...props}
    >
      {roundsNum.map(i => (
        <RoundProgress
          key={i}
          rounds={rounds}
          i={i}
        />
      ))}
    </div>
  );
}

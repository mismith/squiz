import React from 'react';
import { useListVals, useObjectVal } from 'react-firebase-hooks/database';
import Tooltip from '@material-ui/core/Tooltip';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';

import TileButton from './TileButton';
import useHasInteracted from '../hooks/useHasInteracted';
import useRouteParams from '../hooks/useRouteParams';
import { SETTINGS } from '../helpers/settings';
import * as audio from '../helpers/audio';
import { refs, keyField } from '../helpers/firebase';

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
    '&.active $track': {
      borderRightColor: 'transparent',
    },
  },
  wrapper: {
    display: 'flex',
    flex: 'auto',
    height: theme.spacing(3.5),
    padding: theme.spacing(1.5, 0),
    margin: theme.spacing(-1.5, 0),
    transition: 'padding 300ms, margin 300ms',
    '&:not(:last-child) $track': {
      borderRight: 'solid 1px black',
    },
    '&.active': {
      cursor: 'pointer',
    },
    '&.active:hover': {
      padding: theme.spacing(1, 0),
    },
    '&.active $track': {
      backgroundColor: theme.palette.primary.main,
    },
  },
  track: {
    display: 'flex',
    width: '100%',
    height: '100%',
    backgroundColor: theme.palette.text.disabled,
    transition: 'background-color 300ms',
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

function TrackProgress({ roundID, j, ...props }) {
  const classes = useStyles();

  const hasInteracted = useHasInteracted();

  const [tracks] = useListVals(roundID && refs.tracks(roundID), { keyField });
  const track = tracks?.[j - 1];
  const correctID = track?.correctID;
  const isActive = j < tracks?.length || !!track?.completed;

  const choice = track?.choices?.find(({ id }) => id === correctID);

  const { gameID } = useRouteParams();
  const [game] = useObjectVal(refs.game(gameID), { keyField });
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
        className={`${classes.wrapper} ${isActive ? 'active' : ''}`}
        onMouseEnter={() => isActive && hasInteracted && !audio.isPlaying() && audio.play(track?.src, false)}
        onMouseLeave={() => isActive && hasInteracted && !audio.isPlaying() && audio.stop(false, false)}
      >
        <div className={classes.track}>
          <div className={classes.step} style={{ width }} />
        </div>
      </div>
    </Tooltip>
  );
}

function RoundProgress({ i, className, ...props }) {
  const classes = useStyles();

  const tracksNum = Array.apply(null, { length: SETTINGS.TRACKS_LIMIT }).map((v, i) => i + 1);

  const { gameID } = useRouteParams();
  const [rounds] = useListVals(refs.rounds(gameID), { keyField });
  const roundID = rounds?.[i - 1]?.id;
  const round = rounds?.[roundID];

  const isActive = i < rounds?.length || (i === rounds?.length && round?.completed);

  return (
    <div className={`${classes.round} ${isActive ? 'active' : ''} ${className || ''}`} {...props}>
      {i <= rounds?.length && tracksNum.map(j => (
        <TrackProgress key={j} j={j} roundID={roundID} />
      ))}
    </div>
  );
}

export default function ProgressIndicator({ className, ...props }) {
  const classes = useStyles();
  
  const roundsNum = Array.apply(null, { length: SETTINGS.ROUNDS_LIMIT }).map((v, i) => i + 1);

  return (
    <div
      className={`${classes.root} ${className || ''}`}
      {...props}
    >
      {roundsNum.map(i => (
        <RoundProgress key={i} i={i} />
      ))}
    </div>
  );
}

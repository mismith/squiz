import React, { useState } from 'react';
import { useListVals, useObjectVal } from 'react-firebase-hooks/database';
import useAsyncEffect from 'use-async-effect';
import CountTo from 'react-count-to';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';

import SpotifyButton from './SpotifyButton';
import DialogConfirm from './DialogConfirm';
import ScoreChange from './ScoreChange';
import Loader from './Loader';
import useRouteParams from '../hooks/useRouteParams';
import { getPlayerScore, getScores, removePlayer } from '../helpers/game';
import { refs, keyField, useLatestObjectVal } from '../helpers/firebase';
import usePrevious from '../hooks/usePrevious';

const useStyles = makeStyles(theme => ({
  root: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    padding: theme.spacing(0, 1),
  },
  player: {
    display: 'inline-flex',
    flexDirection: 'column',
    alignItems: 'center',
    margin: theme.spacing(),
  },
  name: {
    maxWidth: 200,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
}));

export function Player({ player, onRemove, className, ...props }) {
  const classes = useStyles();

  const playerID = player.id;
  const { gameID } = useRouteParams();
  const [game] = useObjectVal(refs.game(gameID), { keyField });
  const [round] = useLatestObjectVal(refs.rounds(gameID), { keyField });
  const roundID = round?.id;
  const [track, loading] = useLatestObjectVal(roundID && refs.tracks(roundID), { keyField });
  const trackID = track?.id;
  const [guess] = useObjectVal(trackID && refs.guess(trackID, playerID))

  // track previous score in order to animate counting up
  const [score, setScore] = useState(0);
  const [prevScore] = usePrevious(score);
  useAsyncEffect(async (isMounted) => {
    const scores = await getScores(gameID);
    if (isMounted()) return;
    setScore(getPlayerScore(scores, gameID, playerID));
  }, [gameID, playerID, track?.completed, round?.completed, game?.completed]);
  
  const gameActive = !loading && game?.id && !game?.paused;
  const roundInProgress = !round?.completed;
  const trackCompleted = track?.completed;
  const isCorrect = guess?.choiceID === track?.correctID;
  const showCorrectColor = isCorrect ? 'primary' : 'secondary';

  const variant = gameActive && roundInProgress && guess ? 'contained' : 'outlined';
  const color = gameActive && trackCompleted && roundInProgress ? showCorrectColor : 'default';
  const change = (gameActive && trackCompleted && roundInProgress && isCorrect && (score - prevScore)) || 0;

  return (
    <div
      className={`${classes.player} ${className || ''}`}
      style={{
        visibility: !player.id && 'hidden',
        opacity: player.inactive ? 0.5 : 1,
      }}
      {...props}
    >
      <Grid container justify="center" alignItems="center" style={{ marginBottom: 8 }}>
        <ScoreChange change={change} style={{ visibility: 'hidden' }} />
        <Typography variant="h5">
          <CountTo
            from={prevScore}
            to={score}
            speed={1000}
            delay={32}
          />
        </Typography>
        <ScoreChange change={change} />
      </Grid>
      <SpotifyButton
        variant={variant}
        color={color}
        onClick={() => onRemove?.(player)}
      >
        <span className={classes.name}>{player.name}</span>
      </SpotifyButton>
    </div>
  );
}

export default function Players({ className, ...props }) {
  const classes = useStyles();

  const { gameID } = useRouteParams();
  const [players, loading] = useListVals(refs.players(gameID), { keyField });

  const [playerToRemove, setPlayerToRemove] = useState(null);
  const handleClose = () => setPlayerToRemove(null);
  const handleRemove = async () => {
    await removePlayer(gameID, playerToRemove.id);
    handleClose();
  };

  if (loading) {
    return (
      <Loader />
    );
  }
  return (
    <div className={`${classes.root} ${className || ''}`} {...props}>
      {players.map(player => (
        <Player
          key={player.id}
          player={player}
          onRemove={player => setPlayerToRemove(player)}
        />
      ))}
      {!players.length && (
        <Typography variant="overline" style={{ padding: 16, margin: 'auto' }}>
          Join the game on your device to start
        </Typography>
      )}

      <DialogConfirm
        open={Boolean(playerToRemove)}
        title="Remove player?"
        onCancel={handleClose}
        onConfirm={handleRemove}
      >
        Are you sure you want to remove <strong>{playerToRemove?.name}</strong> from the game?
      </DialogConfirm>
    </div>
  );
}

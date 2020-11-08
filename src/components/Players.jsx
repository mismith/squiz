import React, { useState } from 'react';
import { useCollectionData, useDocumentData } from 'react-firebase-hooks/firestore';
import CountTo from 'react-count-to';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';

import SpotifyButton from './SpotifyButton';
import DialogConfirm from './DialogConfirm';
import ScoreChange from './ScoreChange';
import Loader from './Loader';
import {
  getTrackPointsForPlayer,
  useTrack,
  useLatestDocument,
  useGame,
} from '../helpers/game';

const styles = {
  player: {
    display: 'inline-flex',
    flexDirection: 'column',
    alignItems: 'center',
    margin: 'auto',
  },
  name: {
  },
};

export function Player({ player, onRemove, ...props }) {
  const [{ value: game, loading: gameLoading }, gameRef] = useGame();
  const roundsRef = gameRef.collection('rounds');
  const { value: { ref: roundRef } = {}, loading: roundRefLoading } = useLatestDocument(roundsRef);
  const { value: round, loading: roundLoading } = useDocumentData(roundRef, null, 'id');
  const { track, loading: trackLoading } = useTrack(roundRef);
  
  const loading = gameLoading || roundRefLoading || roundLoading || trackLoading;

  const gameActive = !loading && !game?.paused;
  const trackCompleted = track?.completed;
  const roundInProgress = !round?.completed;
  const response = track?.players?.[player.id];
  const isCorrect = response?.choiceID === track?.id;
  const showCorrectColor = isCorrect ? 'primary' : 'secondary';
  const points = getTrackPointsForPlayer(track, player.id); // @TODO: compute difference from local state instead of recalculating

  const score = player.score || 0;
  const variant = gameActive && roundInProgress && response ? 'contained' : 'outlined';
  const color = gameActive && trackCompleted && roundInProgress ? showCorrectColor : 'default';
  const change = (gameActive && trackCompleted && roundInProgress && isCorrect && points) || 0;

  if (loading) {
    return (
      <Loader />
    );
  }
  return (
    <div
      style={{
        ...styles.player,
        visibility: !player.id && 'hidden',
        opacity: player.inactive ? 0.5 : 1,
      }}
      {...props}
    >
      <Grid container justify="center" alignItems="center" style={{ marginBottom: 8 }}>
        <ScoreChange change={change} style={{ visibility: 'hidden' }} />
        <Typography variant="h5">
          <CountTo
            from={score - change}
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
        style={styles.name}
        onClick={() => onRemove?.(player)}
      >
        {player.name}
      </SpotifyButton>
    </div>
  );
}

export default function Players() {
  const [, gameRef] = useGame();
  const playersRef = gameRef.collection('players');
  const {
    value: players = [],
    loading,
  } = useCollectionData(playersRef.orderBy('timestamp'), null, 'id');

  const [playerToRemove, setPlayerToRemove] = useState(null);
  const handleClose = () => setPlayerToRemove(null);
  const handleRemove = async () => {
    await playersRef.doc(playerToRemove.id).delete();
    handleClose();
  };

  if (loading) {
    return (
      <Loader />
    );
  }
  return (
    <>
      {players.map(player => (
        <Player
          key={player.id}
          player={player}
          onRemove={player => setPlayerToRemove(player)}
        />
      ))}
      {!players.length && (
        <Typography variant="h3" color="secondary" style={{ margin: 'auto' }}>
          Join Game to Play
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
    </>
  );
}

import React, { useState } from 'react';
import { useCollectionData, useDocumentData } from 'react-firebase-hooks/firestore';
import CountTo from 'react-count-to';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';

import SpotifyButton from './SpotifyButton';
import DialogConfirm from './DialogConfirm';
import ScoreChange from './ScoreChange';
import {
  RESULTS_COUNTUP,
  getTrackPointsForPlayer,
  useTrack,
  useLatestDocument,
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

export default function Players({ gameRef }) {
  const { value: game, loading: gameLoading } = useDocumentData(gameRef);
  const roundsRef = gameRef.collection('rounds');
  const { value: { ref: roundRef } = {}, loading: roundRefLoading } = useLatestDocument(roundsRef);
  const { value: round, loading: roundLoading } = useDocumentData(roundRef, null, 'id');
  const { track, loading: trackLoading } = useTrack(roundRef);

  const playersRef = gameRef.collection('players');
  const {
    value: players = [],
    loading: playersLoading,
  } = useCollectionData(playersRef.orderBy('timestamp'), null, 'id');

  const loading = gameLoading || roundRefLoading || roundLoading || trackLoading
    || playersLoading;
  const gameActive = !loading && !game?.paused;
  const trackCompleted = track?.completed;
  const roundInProgress = !round?.completed;

  const playersWithResponses = players.map((player) => {
    const response = track?.players?.[player.id];
    const isCorrect = response?.choiceID === track?.id;
    const showCorrectColor = isCorrect ? 'primary' : 'secondary';
    const points = getTrackPointsForPlayer(track, player.id); // @TODO: compute difference from local state instead of recalculating

    return {
      ...player,
      score: player.score || 0,
      $variant: gameActive && roundInProgress && response ? 'contained' : 'outlined',
      $color: gameActive && trackCompleted && roundInProgress ? showCorrectColor : 'default',
      $change: (gameActive && trackCompleted && roundInProgress && isCorrect && points) || 0,
      $isCorrect: isCorrect,
    };
  });


  const [playerToRemove, setPlayerToRemove] = useState(null);
  const handleClose = () => setPlayerToRemove(null);
  const handleRemove = async () => {
    await playersRef.doc(playerToRemove.id).delete();
    handleClose();
  };

  return (
    <>
      {playersWithResponses.map(player =>
        <div
          key={player.id}
          style={{...styles.player, visibility: !player.id && 'hidden', opacity: player.inactive ? 0.5 : 1 }}
        >
          <Grid container justify="center" alignItems="center" style={{ marginBottom: 8 }}>
            {gameActive && <ScoreChange change={player.$change} style={{ visibility: 'hidden' }} />}
            <Typography variant="h5">
              <CountTo
                from={player.score - player.$change}
                to={player.score}
                speed={RESULTS_COUNTUP}
                delay={32}
              />
            </Typography>
            {gameActive && <ScoreChange change={player.$change} />}
          </Grid>
          <SpotifyButton
            variant={player.$variant}
            color={player.$color}
            style={styles.name}
            onClick={() => setPlayerToRemove(player)}
          >
            {player.name}
          </SpotifyButton>
        </div>
      )}
      <DialogConfirm
        open={Boolean(playerToRemove)}
        title="Remove player?"
        body={<>Are you sure you want to remove <strong>{playerToRemove?.name}</strong> from the game?</>}
        onCancel={handleClose}
        onConfirm={handleRemove}
      />
      {!playersWithResponses.length && (
        <Typography variant="h3" color="secondary" style={{ margin: 'auto' }}>
          Join Game to Play
        </Typography>
      )}
    </>
  );
}

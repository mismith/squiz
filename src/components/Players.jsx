import React, { useState } from 'react';
import { useCollectionData, useDocumentData } from 'react-firebase-hooks/firestore';
import CountTo from 'react-count-to';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import Zoom from '@material-ui/core/Zoom';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@material-ui/core';

import SpotifyButton from './SpotifyButton';
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

export default ({ gameRef }) => {
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
  const gameActive = !loading && game && !game.paused;
  const trackCompleted = track && track.completed;
  const roundInProgress = round && !round.completed;

  const playersWithResponses = players.map((player) => {
    const response = track && track.players && track.players[player.id];
    const isCorrect = response && response.choiceID === track.id;
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

  const PlayerChange = ({ player, ...props }) => (
    <Zoom in={gameActive && !!player.$change} {...props}>
      <Typography variant="h6" color="primary">
        <span style={{margin: 4}}>+</span>{player.$change}
      </Typography>
    </Zoom>
  );

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
          <Grid container justify="center" alignItems="center" style={{marginBottom: 8}}>
            <PlayerChange player={player} style={{visibility: 'hidden'}} />
            <Typography variant="h5">
              <CountTo
                from={player.score - player.$change}
                to={player.score}
                speed={RESULTS_COUNTUP}
                delay={32}
              />
            </Typography>
            <PlayerChange player={player} />
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
      <Dialog open={!!playerToRemove} onClose={handleClose}>
        <DialogTitle>Remove player?</DialogTitle>
        {playerToRemove &&
          <DialogContent>
            <Typography>Are you sure you want to remove <strong>{playerToRemove.name}</strong> from the game?</Typography>
          </DialogContent>
        }
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button color="primary" onClick={handleRemove}>Remove</Button>
        </DialogActions>
      </Dialog>
      {playersWithResponses.length < 2 &&
        <div style={{textAlign: 'center', margin: 'auto'}}>
          <Typography variant="overline" component="div">Join Game at</Typography>
          <Typography variant="h4" color="primary">{window.location.host}</Typography>
        </div>
      }
    </>
  );
};

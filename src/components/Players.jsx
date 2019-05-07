import React from 'react';
import { useCollectionData, useDocumentData } from 'react-firebase-hooks/firestore';
import CountTo from 'react-count-to';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import Zoom from '@material-ui/core/Zoom';

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
};

export default ({ gameRef }) => {
  const { value: game, loading: gameLoading } = useDocumentData(gameRef);
  const roundsRef = gameRef.collection('rounds');
  const { value: { ref: roundRef } = {}, loading: roundRefLoading } = useLatestDocument(roundsRef);
  const { value: round, loading: roundLoading } = useDocumentData(roundRef, null, 'id');
  const { track, loading: trackLoading } = useTrack(roundRef);

  const playersRef = gameRef.collection('players').orderBy('timestamp');
  const {
    value: players = [{ id: null, name: 'Loading' }],
    loading: playersLoading,
  } = useCollectionData(playersRef, null, 'id');

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
          <SpotifyButton variant={player.$variant} color={player.$color}>
            {player.name}
          </SpotifyButton>
        </div>
      )}
    </>
  );
};

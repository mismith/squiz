import React from 'react';
import { useCollectionData, useDocumentData } from 'react-firebase-hooks/firestore';
import CountTo from 'react-count-to';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import Zoom from '@material-ui/core/Zoom';

import SpotifyButton from './SpotifyButton';
import {
  RESULTS_COUNTUP,
  useTrack,
  getTrackPointsForPlayer,
} from '../helpers/game';

const styles = {
  player: {
    display: 'inline-flex',
    flexDirection: 'column',
    alignItems: 'center',
    margin: 'auto',
  },
};

export default ({ playlistID: roundID, gameRef }) => {
  const playersRef = gameRef.collection('players').orderBy('timestamp');
  const {
    value: players = [{ id: null, name: 'Loading' }],
  } = useCollectionData(playersRef, null, 'id');

  const roundRef = roundID && gameRef.collection('rounds').doc(roundID);
  const { value: round } = useDocumentData(roundRef);
  const { track } = useTrack(roundRef);

  const playersWithResponses = players.map((player) => {
    const response = track && track.players && track.players[player.id];
    const isCorrect = response && response.choiceID === track.id;
    const showCorrectColor = isCorrect ? 'primary' : 'secondary';
    const trackCompleted = track && track.completed;
    const roundInProgress = round && !round.completed;
    const points = getTrackPointsForPlayer(track, player.id);

    return {
      ...player,
      score: player.score || 0,
      $variant: roundInProgress && response ? 'contained' : 'outlined',
      $color: trackCompleted && roundInProgress ? showCorrectColor : 'default',
      $change: (trackCompleted && roundInProgress && isCorrect && points) || 0,
      $isCorrect: isCorrect,
    };
  });

  const PlayerChange = ({ player, ...props }) => (
    <Zoom in={!!player.$change} {...props}>
      <Typography variant="h6" color="primary">
        <span style={{margin: 4}}>+</span>{player.$change}
      </Typography>
    </Zoom>
  );

  return (
    <>
      {playersWithResponses.map(player =>
        <div key={player.id} style={{...styles.player, visibility: !player.id && 'hidden' }}>
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

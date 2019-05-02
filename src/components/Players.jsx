import React from 'react';
import { useCollectionData, useDocumentData } from 'react-firebase-hooks/firestore';
import CountTo from 'react-count-to';
import Typography from '@material-ui/core/Typography';

import SpotifyButton from './SpotifyButton';
import Loader from './Loader';
import {
  RESULTS_COUNTUP,
  useTrack,
  getTrackPointsForPlayer,
} from '../helpers/game';

export default ({ playlistID, gameRef }) => {
  const playersQuery = gameRef.collection('players').orderBy('timestamp');
  const { value: players = [], loading } = useCollectionData(playersQuery, null, 'id');
  const roundRef = playlistID && gameRef.collection('rounds').doc(playlistID);
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

  return (
    <>
      {loading ? (
        <Loader />
      ) : (
        <>
          {playersWithResponses.map(player =>
            <div key={player.id} style={{display: 'inline-flex', flexDirection: 'column', alignItems: 'center', margin: 'auto'}}>
              <Typography variant="h5" style={{marginBottom: 8}}>
                <CountTo
                  from={player.score - player.$change}
                  to={player.score}
                  speed={RESULTS_COUNTUP}
                  delay={32}
                />
              </Typography>
              <SpotifyButton
                variant={player.$variant}
                color={player.$color}
              >
                {player.name}
              </SpotifyButton>
            </div>
          )}
        </>
      )}
    </>
  );
};

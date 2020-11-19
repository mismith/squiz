import React, { useState } from 'react';
import { useListVals } from 'react-firebase-hooks/database';
import useAsyncEffect from 'use-async-effect';
import Typography from '@material-ui/core/Typography';
import Replay from '@material-ui/icons/Replay';

import SpotifyButton from './SpotifyButton';
import useRouteParams from '../hooks/useRouteParams';
import { getPlayerScore, getScores, restartGame } from '../helpers/game';
import { refs, keyField } from '../helpers/firebase';

export default function GameOver(props) {
  const { gameID } = useRouteParams();
  const [players] = useListVals(refs.players(gameID), { keyField });
  
  const [scores, setScores] = useState({});
  useAsyncEffect(async (isMounted) => {
    const scores = await getScores(gameID);
    if (!isMounted()) return;
    setScores(scores);
  }, [gameID]);

  players.forEach(player => {
    player.$score = getPlayerScore(scores, gameID, player.id);
  });
  const [winner] = players.sort((a, b) => a.$score - b.$score);

  const handleRestart = async () => {
    setScores({});
    await restartGame(gameID);
  };

  return (
    <Typography
      variant="h2"
      color="secondary"
      style={{ textAlign: 'center', margin: 'auto' }}
      {...props}
    >
      <div><span role="img" aria-label="Woohoo!">🎉🎉🎉</span></div>
      {winner ? `${winner.name} wins!` : (
        <div style={{ fontVariant: 'all-small-caps' }}>Game Over</div>
      )}

      <footer>
        <SpotifyButton
          icon={<Replay />}
          onClick={handleRestart}
        >
          Play Again
        </SpotifyButton>
      </footer>
    </Typography>
  );
}

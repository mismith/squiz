import React from 'react';
import { useListVals } from 'react-firebase-hooks/database';
import Typography from '@material-ui/core/Typography';
import Replay from '@material-ui/icons/Replay';

import SpotifyButton from './SpotifyButton';
import useRouteParams from '../hooks/useRouteParams';
import { restartGame } from '../helpers/game';
import { refs, keyField } from '../helpers/firebase';

export default function GameOver(props) {
  const { gameID } = useRouteParams();
  const winnerRef = refs.players(gameID).orderByKey('score').limitToLast(1);
  const [[winner] = []] = useListVals(winnerRef, { keyField });

  const handleRestart = () => restartGame(gameID);

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

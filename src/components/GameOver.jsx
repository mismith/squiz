import React from 'react';
import { useCollectionData } from 'react-firebase-hooks/firestore';
import Typography from '@material-ui/core/Typography';

import { useGame } from '../helpers/game';

export default function GameOver(props) {
  const [, gameRef] = useGame();
  const playersRef = gameRef.collection('players').orderBy('score', 'desc');
  const { value: [winner] = [] } = useCollectionData(playersRef, null, 'id');

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
    </Typography>
  );
}

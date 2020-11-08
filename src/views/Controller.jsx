import React, { useState, useEffect } from 'react';
import { useRouteMatch } from 'react-router-dom';
import { useDocumentData } from 'react-firebase-hooks/firestore';
import { useSwipeable } from 'react-swipeable';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';

import GameInfo from '../components/GameInfo';
import useConnectivityStatus from '../hooks/useConnectivityStatus';
import { FieldValue } from '../helpers/firebase';
import { useGame, useLatestDocument, useTrack } from '../helpers/game';
import { directions } from '../helpers/directions';

function usePlayerSwipes(playerID) {
  const [{ value: game }, gameRef] = useGame();
  const roundsRef = gameRef.collection('rounds');
  const { value: { ref: roundRef } = {} } = useLatestDocument(roundsRef);
  const { tracksRef, track } = useTrack(roundRef);

  const [swipe, setSwipe] = useState(null);
  const trackID = track?.id;
  useEffect(() => {
    // reset local swipe marker for each new track
    setSwipe(null);
  }, [trackID]);
  async function onSwiped({ dir }) {
    if (!game?.paused && !game?.inactive && track?.id && !track?.completed && dir !== swipe) {
      // send selection to server
      const choiceIndex = directions.findIndex(direction => direction.dir === dir);
      const choice = track.choices[choiceIndex];
      if (choice?.id) {
        tracksRef.doc(track.id).set({
          players: {
            [playerID]: {
              choiceID: choice.id,
              timestamp: FieldValue.serverTimestamp(),
            },
          },
        }, { merge: true });

        // show selection locally
        setSwipe(dir);
      }
    }
  }
  const handlers = useSwipeable({
    // send swipes to server for processing
    onSwiped,
    preventDefaultTouchmoveEvent: true,
    trackMouse: true, // @DEBUG
  });

  return {
    swipe,
    setSwipe: dir => onSwiped({ dir }),
    handlers,
  };
}

const styles = {
  controller: {
    display: 'flex',
    flexDirection: 'column',
    flex: 'auto',
  },
  directions: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    position: 'relative',
    width: '100%',
    maxWidth: '100vh',
    fontSize: 96,
    margin: 'auto',
  },
  direction: {
    display: 'flex',
    justifyContent: 'center',
    flexBasis: '50%',
    pointerEvents: 'none',
    userSelect: 'none',
  },
  label: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 16,
    opacity: 0.25,
  },
};

export default function Controller() {
  const { params: { gameID, playerID } } = useRouteMatch();
  const [, gameRef] = useGame();
  const playerRef = gameRef.collection('players').doc(playerID);
  const { value: player } = useDocumentData(playerRef, null, 'id');

  useConnectivityStatus(playerRef);
  const { swipe, handlers } = usePlayerSwipes(playerID);

  return (
    <div style={styles.controller} {...handlers}>
      <AppBar color="default" position="static">
        <Toolbar style={{ flexWrap: 'wrap' }}>
          <GameInfo name="Game Site" value={window.location.host} color="primary" />
          <GameInfo name="Game Code" value={gameID} color="secondary" />
          <GameInfo name="Your Name" value={player?.name} />
        </Toolbar>
      </AppBar>

      <Typography component="div" color="textSecondary" style={styles.directions}>
        {directions.map(({ dir, icon: DirIcon }) =>
          <div
            key={dir}
            style={{
              ...styles.direction,
              margin: (dir === 'Up' || dir === 'Down') && 'calc(25% - 96px) 10px',
            }}
          >
            <DirIcon
              color={swipe === dir ? 'primary' : 'inherit'}
              style={{ fontSize: 'inherit' }}
            />
          </div>
        )}
        <label style={styles.label}>Swipe</label>
      </Typography>
    </div>
  );
}

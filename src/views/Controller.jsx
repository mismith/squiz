import React, { useState, useEffect } from 'react';
import { useDocumentData } from 'react-firebase-hooks/firestore';
import { useSwipeable } from 'react-swipeable';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';

import GameCode from '../components/GameCode';
import useConnectivityStatus from '../hooks/useConnectivityStatus';
import { firestore, FieldValue } from '../helpers/firebase';
import { useLatestDocument, useTrack } from '../helpers/game';
import { directions } from '../helpers/directions';

function usePlayerSwipes(gameRef, playerID) {
  const { value: game } = useDocumentData(gameRef, null, 'id');
  const roundsRef = gameRef.collection('rounds');
  const { value: { ref: roundRef } = {} } = useLatestDocument(roundsRef);
  const { tracksRef, track } = useTrack(roundRef);

  const [swipe, setSwipe] = useState(null);
  useEffect(() => {
    // reset local swipe marker for each new track
    setSwipe(null);
  }, [track?.id]);
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

function useZoomPrevention() {
  useEffect(() => {
    // prevent zooming on mobile: https://stackoverflow.com/a/39711930/888928
    const handleGestureStart = e => e.preventDefault();
    document.addEventListener('gesturestart', handleGestureStart);

    return () => {
      document.removeEventListener('gesturestart', handleGestureStart);
    };
  }, []);
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

export default function Controller({ gameID, playerID }) {
  const gameRef = firestore.collection('games').doc(gameID);
  const playerRef = gameRef.collection('players').doc(playerID);

  useZoomPrevention();
  useConnectivityStatus(playerRef);
  const { swipe, setSwipe, handlers } = usePlayerSwipes(gameRef, playerID);

  const roundsRef = gameRef.collection('rounds');
  const { value: { ref: roundRef } = {} } = useLatestDocument(roundsRef);
  const { value: track } = useLatestDocument(roundRef?.collection('tracks'));
  useEffect(() => {
    setSwipe(null);
  }, [track]);

  return (
    <div style={styles.controller} {...handlers}>
      <AppBar color="default" position="static">
        <Toolbar>
          <GameCode gameID={gameID} />
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

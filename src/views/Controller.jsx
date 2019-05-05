import React, { useState, useEffect } from 'react';
import { useDocumentData } from 'react-firebase-hooks/firestore';
import { useSwipeable } from 'react-swipeable';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import KeyboardArrowUp from '@material-ui/icons/KeyboardArrowUp';
import KeyboardArrowLeft from '@material-ui/icons/KeyboardArrowLeft';
import KeyboardArrowRight from '@material-ui/icons/KeyboardArrowRight';
import KeyboardArrowDown from '@material-ui/icons/KeyboardArrowDown';

import GameCode from '../components/GameCode';
import { firestore, FieldValue } from '../helpers/firebase';
import { useLatestDocument, useTrack } from '../helpers/game';

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
    pointerEvents: 'none',
  }
};

export default ({ gameID, playerID }) => {
  const directions = [
    { dir: 'Up', icon: KeyboardArrowUp },
    { dir: 'Left', icon: KeyboardArrowLeft },
    { dir: 'Right', icon: KeyboardArrowRight },
    { dir: 'Down', icon: KeyboardArrowDown },
  ];

  const gameRef = firestore.collection('games').doc(gameID);
  const { value: game } = useDocumentData(gameRef, null, 'id');
  const roundsRef = gameRef.collection('rounds');
  const { value: { ref: roundRef } = {} } = useLatestDocument(roundsRef);
  const { tracksRef, track } = useTrack(roundRef);

  const playerRef = gameRef.collection('players').doc(playerID);

  // handle user swipes
  const [swipe, setSwipe] = useState(null);
  useEffect(() => {
    // reset local swipe marker for each new track
    setSwipe(null);
  }, [track && track.id]);
  const handlers = useSwipeable({
    // send swipes to server for processing
    async onSwiped({ dir }) {
      if (game && !game.paused && track && !track.completed && dir !== swipe) {
        // send selection to server
        const choiceIndex = directions.findIndex(direction => direction.dir === dir);
        const choice = track.choices[choiceIndex];
        tracksRef.doc(track.id).set({
          players: {
            [playerID]: {
              choiceID: choice && choice.id,
              timestamp: FieldValue.serverTimestamp(),
            },
          },
        }, { merge: true });

        // show selection locally
        setSwipe(dir);
      }
    },
    preventDefaultTouchmoveEvent: true,
    trackMouse: true, // @DEBUG
  });
  useEffect(() => {
    // prevent zooming on mobile: https://stackoverflow.com/a/39711930/888928
    const handleGestureStart = e => e.preventDefault();
    document.addEventListener('gesturestart', handleGestureStart);

    return () => {
      document.removeEventListener('gesturestart', handleGestureStart);
    };
  }, []);

  // maintain player connectivity status
  useEffect(() => {
    const setInactive = to => playerRef.set({
      inactive: to,
    }, { merge: true });

    // monitor tab changes
    const handleVisibilityChange = () => {
      setInactive(document.hidden ? FieldValue.serverTimestamp() : FieldValue.delete());
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // monitor tab closes
    const handleBeforeUnload = () => {
      setInactive(FieldValue.serverTimestamp());
    };
    document.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return (
    <div style={styles.controller} {...handlers}>
      <AppBar color="default" position="static">
        <Toolbar>
          <GameCode gameID={gameID} />
        </Toolbar>
      </AppBar>

      <Typography component="div" color="textSecondary" style={styles.directions}>
        {directions.map(({ dir, icon: DirIcon}) =>
          <div key={dir} style={{
            ...styles.direction,
            margin: (dir === 'Up' || dir === 'Down') && 'calc(25% - 96px) 10px',
          }}>
            <DirIcon color={swipe === dir ? 'primary' : 'inherit'} style={{fontSize: 'inherit'}} />
          </div>
        )}
        <label style={styles.label}>Swipe</label>
      </Typography>
    </div>
  );
};

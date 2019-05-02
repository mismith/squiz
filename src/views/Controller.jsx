import React, { useState, useEffect } from 'react';
import { useSwipeable } from 'react-swipeable';
import { useCollection } from 'react-firebase-hooks/firestore';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import KeyboardArrowUp from '@material-ui/icons/KeyboardArrowUp';
import KeyboardArrowLeft from '@material-ui/icons/KeyboardArrowLeft';
import KeyboardArrowRight from '@material-ui/icons/KeyboardArrowRight';
import KeyboardArrowDown from '@material-ui/icons/KeyboardArrowDown';

import { retrieveAccessToken } from '../helpers/spotify';
import { firestore } from '../helpers/firebase';
import { useTrack } from '../helpers/game';

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
  useEffect(() => {
    retrieveAccessToken();
  }, []);

  const [swipe, setSwipe] = useState(null);
  const directions = [
    { dir: 'Up', icon: KeyboardArrowUp },
    { dir: 'Left', icon: KeyboardArrowLeft },
    { dir: 'Right', icon: KeyboardArrowRight },
    { dir: 'Down', icon: KeyboardArrowDown },
  ];

  // drill down to the current round's current track (if there is one)
  const roundsRef = firestore.collection('games').doc(gameID).collection('rounds');
  const roundQuery = roundsRef.orderBy('timestamp', 'desc').limit(1);
  const { value: { docs: [roundDoc] = [] } = {} } = useCollection(roundQuery);
  const { tracksRef, track } = useTrack(roundDoc && roundDoc.ref);

  useEffect(() => {
    // reset local swipe marker for each new track
    setSwipe(null);
  }, [track && track.id]);

  // send swipes to server for processing
  const handlers = useSwipeable({
    async onSwiped({ dir }) {
      if (track && track.id) {
        // send selection to server
        const choiceIndex = directions.findIndex(direction => direction.dir === dir);
        const choice = track.choices[choiceIndex];
        tracksRef.doc(track.id).set({
          players: {
            [playerID]: {
              choiceID: choice && choice.id,
              timestamp: Date.now(),
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
    document.addEventListener('gesturestart', e => e.preventDefault());
  }, []);

  return (
    <div style={styles.controller} {...handlers}>
      <AppBar color="default" position="static">
        <Toolbar>
          <Typography style={{margin: 'auto'}}>
            Game Code: {gameID}
          </Typography>
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

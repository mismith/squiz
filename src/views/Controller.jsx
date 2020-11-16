import React, { useState, useEffect } from 'react';
import { useObjectVal } from 'react-firebase-hooks/database';
import { useSwipeable } from 'react-swipeable';
import Typography from '@material-ui/core/Typography';

import useRouteParams from '../hooks/useRouteParams';
import useConnectivityStatus from '../hooks/useConnectivityStatus';
import { refs, keyField, ServerValue, useLatestObjectVal } from '../helpers/firebase';
import { directions } from '../helpers/directions';
import TopBar from '../components/TopBar';
import { SETTINGS } from '../helpers/settings';

function usePlayerSwipes() {
  const { gameID, playerID } = useRouteParams();
  const [game] = useObjectVal(refs.game(gameID));
  const [round] = useLatestObjectVal(refs.rounds(gameID), { keyField });
  const roundID = round?.id;
  const [track] = useLatestObjectVal(roundID && refs.tracks(roundID), { keyField });
  const trackID = track?.id;

  const [swipe, setSwipe] = useState(null);
  useEffect(() => {
    // reset local swipe marker for each new track
    setSwipe(null);
  }, [gameID, game?.paused, game?.inactive, roundID, trackID, track?.completed, playerID]);
  async function onSwiped({ dir }) {
    if (!game?.paused && !game?.inactive && track?.id && !track?.completed && dir !== swipe) {
      // send guess to server
      const choiceIndex = directions.findIndex(direction => direction.dir === dir);
      const choice = track.choices[choiceIndex];
      if (choice?.id) {
        const guessRef = refs.guess(trackID, playerID);
        const attempts = (await guessRef.child('attempts').once('value')).val() || 0;
        if (!SETTINGS.GUESS_ATTEMPTS || attempts < SETTINGS.GUESS_ATTEMPTS) {
          // show selection locally
          setSwipe(dir);

          // add guess to record
          await guessRef.set({
            choiceID: choice.id,
            attempts: attempts + 1,
            timestamp: ServerValue.TIMESTAMP,
          });
        }
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

export function SwipeArea() {
  const { swipe, handlers } = usePlayerSwipes();

  return (
    <Typography component="div" color="textSecondary" style={styles.directions} {...handlers}>
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
  );
}

export default function Controller() {
  const { gameID, playerID } = useRouteParams();

  useConnectivityStatus(refs.player(gameID, playerID));

  return (
    <div style={styles.controller}>
      <TopBar />

      <SwipeArea />
    </div>
  );
}

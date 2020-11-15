import React, { useState, useEffect } from 'react';
import { useObjectVal } from 'react-firebase-hooks/database';
import { useSwipeable } from 'react-swipeable';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Skeleton from '@material-ui/lab/Skeleton';

import GameInfo from '../components/GameInfo';
import useRouteParams from '../hooks/useRouteParams';
import useConnectivityStatus from '../hooks/useConnectivityStatus';
import { refs, keyField, ServerValue, useLatestObjectVal } from '../helpers/firebase';
import { directions } from '../helpers/directions';

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
      // send selection to server
      const choiceIndex = directions.findIndex(direction => direction.dir === dir);
      const choice = track.choices[choiceIndex];
      if (choice?.id) {
        // show selection locally
        setSwipe(dir);

        await refs.guess(trackID, playerID).set({
          choiceID: choice.id,
          timestamp: ServerValue.TIMESTAMP,
        });
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

export function PlayerName({ playerRef }) {
  const [player, loading] = useObjectVal(playerRef);

  return loading ? <Skeleton variant="text" width={100} /> : <>{player?.name}</>;
}

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
  const playerRef = refs.player(gameID, playerID);

  useConnectivityStatus(playerRef);

  return (
    <div style={styles.controller}>
      <AppBar color="default" position="static">
        <Toolbar style={{ flexWrap: 'wrap' }}>
          <GameInfo name="Game Site" value={window.location.host} color="primary" />
          <GameInfo name="Game Code" value={gameID} color="secondary" />
          <GameInfo name="Your Name" value={<PlayerName playerRef={playerRef} />} />
        </Toolbar>
      </AppBar>

      <SwipeArea />
    </div>
  );
}

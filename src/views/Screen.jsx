import React from 'react';
import { useRouteMatch } from 'react-router-dom';
import AppBar from '@material-ui/core/AppBar';
import Typography from '@material-ui/core/Typography';

import TopBar from '../components/TopBar';
import CategoryList from '../components/CategoryList';
import PlaylistList from '../components/PlaylistList';
import TrackList from '../components/TrackList';
import Players from '../components/Players';
import Loader from '../components/Loader';
import GameOver from '../components/GameOver';
import ProgressIndicator from '../components/ProgressIndicator';
import useConnectivityStatus from '../hooks/useConnectivityStatus';
import { useGame } from '../helpers/game';

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    flex: 'auto',
    height: '100%',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    flex: 'auto',
    overflow: 'auto',
  },
  rounds: {
    label: {
      marginLeft: 'auto',
      marginRight: 16,
    },
    stepper: {
      background: 'transparent',
    },
  },
};

export function Content() {
  const [{ value: game, loading }] = useGame();
  const { params: { categoryID, playlistID } } = useRouteMatch();

  if (loading) {
    return (
      <Loader />
    );
  }
  return (
    <>
      {game?.id
        ? (
          <div style={styles.content}>
            {game?.completed ? (
              <GameOver />
            ) : (
              <>
                {!categoryID && (
                  <CategoryList />
                )}
                {categoryID && !playlistID && (
                  <PlaylistList />
                )}
                {categoryID && playlistID && (
                  <TrackList />
                )}
              </>
            )}
          </div>
        ) : (
          <Typography variant="h3" color="secondary" style={{ margin: 'auto' }}>
            Game not found
          </Typography>
        )
      }
    </>
  );
}

export default function Screen() {
  const [, gameRef] = useGame();

  useConnectivityStatus(gameRef);

  return (
    <div style={styles.container}>
      <TopBar />

      <Content />
  
      <AppBar color="default" position="static" style={{ paddingBottom: 16 }}>
        <ProgressIndicator style={{ marginBottom: 16 }} />

        <Players />
      </AppBar>
    </div>
  );
}

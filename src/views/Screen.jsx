import React from 'react';
import { useObjectVal } from 'react-firebase-hooks/database';
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
import useRouteParams from '../hooks/useRouteParams';
import { refs, keyField } from '../helpers/firebase';

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
  const { gameID, categoryID, playlistID } = useRouteParams();
  const [game, loading] = useObjectVal(refs.game(gameID), { keyField });

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
  const { gameID } = useRouteParams();

  useConnectivityStatus(refs.game(gameID));

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

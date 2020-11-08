import React from 'react';
import { useRouteMatch } from 'react-router-dom';
import { useCollectionData } from 'react-firebase-hooks/firestore';
import { useAsync } from 'react-async-hook';
import AppBar from '@material-ui/core/AppBar';
import Typography from '@material-ui/core/Typography';

import TopBar from '../components/TopBar';
import CategoryList from '../components/CategoryList';
import PlaylistList from '../components/PlaylistList';
import TrackList from '../components/TrackList';
import Players from '../components/Players';
import Loader from '../components/Loader';
import ProgressIndicator from '../components/ProgressIndicator';
import useConnectivityStatus from '../hooks/useConnectivityStatus';
import { loadCategories, loadCategoryPlaylists } from '../helpers/spotify';
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
  const [{ value: game, loading: gameLoading }] = useGame();
  const { params: { categoryID, playlistID } } = useRouteMatch();

  const {
    result: categories,
    loading: categoriesLoading,
  } = useAsync(loadCategories, []);
  const {
    result: playlists,
    loading: playlistsLoading,
  } = useAsync(loadCategoryPlaylists, [categoryID]);
  const loading = gameLoading || categoriesLoading || playlistsLoading;

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
                  <CategoryList categories={categories} />
                )}
                {categoryID && !playlistID && (
                  <PlaylistList playlists={playlists} />
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

export function GameOver(props) {
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
      <span role="img" aria-label="Woohoo!">🎉🎉🎉</span><br />
      {winner ? `${winner.name} wins!` : (
        <span style={{ fontVariant: 'all-small-caps' }}>Game Over</span>
      )}
    </Typography>
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

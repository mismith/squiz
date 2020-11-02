import React, { useState } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { useDocumentData, useCollectionData } from 'react-firebase-hooks/firestore';
import { useAsync } from 'react-async-hook';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import CloseIcon from '@material-ui/icons/Close';
import ArrowBackIosIcon from '@material-ui/icons/ArrowBackIos';

import GameCode from '../components/GameCode';
import CategoryList from '../components/CategoryList';
import PlaylistList from '../components/PlaylistList';
import TrackList from '../components/TrackList';
import Players from '../components/Players';
import Loader from '../components/Loader';
import ProgressIndicator from '../components/ProgressIndicator';
import DialogConfirm from '../components/DialogConfirm';
import { firestore } from '../helpers/firebase';
import { loadCategories, loadCategoryPlaylists } from '../helpers/spotify';
import { endGame } from '../helpers/game';

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

export function TopBar({ gameID, categoryID, playlistID, game, gameRef }) {

  let to = '';
  if (gameID && categoryID) {
    to += `/games/${gameID}`;
  }
  if (categoryID && playlistID) {
    to += `/${categoryID}`;
  }

  const history = useHistory();
  const [confirmQuit, setConfirmQuit] = useState(false);
  const handleCancelQuit = () => setConfirmQuit(false);
  const handleConfirmQuit = async () => {
    await endGame(gameRef);
    handleCancelQuit();
    history.push('/');
  };

  return (
    <AppBar color="default" position="static">
      <Toolbar style={{ justifyContent: 'center' }}>
        <Grid item xs={4}>
          {categoryID ? (
            <Button component={Link} to={to}>
              <ArrowBackIosIcon style={{ marginRight: 8 }} />
              Back
            </Button>
          ) : (
            <Button onClick={() => setConfirmQuit(true)}>
              <CloseIcon style={{ marginRight: 8 }} />
              Quit
            </Button>
          )}

          <DialogConfirm
            open={Boolean(confirmQuit)}
            title="Quit Game"
            body="Are you sure you want to permanently end this game for all players?"
            onCancel={handleCancelQuit}
            onConfirm={handleConfirmQuit}
          />
        </Grid>

        <GameCode gameID={gameID} />

        <Grid item container xs={4} />
      </Toolbar>
    </AppBar>
  );
}

export default ({ gameID, categoryID, playlistID }) => {
  const gameRef = firestore.collection('games').doc(gameID);
  const {
    value: game,
    loading: gameLoading,
  } = useDocumentData(gameRef, null, 'id');
  const {
    result: categories,
    loading: categoriesLoading,
  } = useAsync(() => loadCategories(), []);
  const {
    result: playlists,
    loading: playlistsLoading,
  } = useAsync(() => categoryID && loadCategoryPlaylists(categoryID), [categoryID]);
  const loading = gameLoading || categoriesLoading || playlistsLoading;

  const playersRef = gameRef.collection('players').orderBy('score', 'desc');
  const { value: [winner] = [] } = useCollectionData(playersRef, null, 'id');

  return (
    <div style={styles.container}>
      <TopBar
        gameID={gameID}
        categoryID={categoryID}
        playlistID={playlistID}
        game={game}
        gameRef={gameRef}
      />

      {loading
        ? <Loader />
        : (game?.id
          ? (
            <div style={styles.content}>
              {game?.completed ? (
                <Typography variant="h2" color="secondary" style={{ textAlign: 'center', margin: 'auto' }}>
                  <span role="img" aria-label="Woohoo!">🎉🎉🎉</span><br />
                  {winner ? `${winner.name} wins!` : (
                    <span style={{ fontVariant: 'all-small-caps' }}>Game Over</span>
                  )}
                </Typography>
              ) : (
                <>
                  {!categoryID && (
                    <CategoryList categories={categories} />
                  )}
                  {categoryID && !playlistID && (
                    <PlaylistList playlists={playlists} />
                  )}
                  {categoryID && playlistID && (
                    <TrackList
                      categoryID={categoryID}
                      playlistID={playlistID}
                      gameRef={gameRef}
                    />
                  )}
                </>
              )}
            </div>
          ) : (
            <Typography variant="h3" color="secondary" style={{ margin: 'auto' }}>
              Game not found
            </Typography>
          ))
      }
  
      <AppBar color="default" position="static" style={{ paddingBottom: 16 }}>
        <ProgressIndicator gameRef={gameRef} style={{ marginBottom: 16 }} />

        <Toolbar>
          <Players gameRef={gameRef} />
        </Toolbar>
      </AppBar>
    </div>
  );
};

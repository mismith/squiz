import React from 'react';
import { Link } from 'react-router-dom';
import { useDocumentData, useCollectionData } from 'react-firebase-hooks/firestore';
import { useAsync } from 'react-async-hook';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import MobileStepper from '@material-ui/core/MobileStepper';
import CloseIcon from '@material-ui/icons/Close';
import ArrowBackIosIcon from '@material-ui/icons/ArrowBackIos';

import GameCode from '../components/GameCode';
import CategoryList from '../components/CategoryList';
import PlaylistList from '../components/PlaylistList';
import TrackList from '../components/TrackList';
import Players from '../components/Players';
import Loader from '../components/Loader';
import { firestore } from '../helpers/firebase';
import { loadCategories, loadPlaylists } from '../helpers/spotify';
import { ROUNDS_LIMIT } from '../helpers/game';

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
  const { value: rounds } = useCollectionData(gameRef.collection('rounds'));

  let to = '';
  if (gameID && categoryID) {
    to += `/games/${gameID}`;
  }
  if (categoryID && playlistID) {
    to += `/${categoryID}`;
  }

  return (
    <AppBar color="default" position="static">
      <Toolbar style={{ justifyContent: 'center' }}>
        <Grid item xs={4}>
          <Button component={Link} to={to}>
              {!categoryID ? (
                <CloseIcon style={{ marginRight: 8 }} />
              ) : (
                <ArrowBackIosIcon style={{ marginRight: 8 }} />
              )}
              {!categoryID ? 'Exit' : 'Back'}
          </Button>
        </Grid>

        <GameCode gameID={gameID} />

        <Grid item container xs={4}>
          {!!rounds?.length &&
            <>
              <Typography
                variant="overline"
                component="small"
                color={game?.completed ? 'secondary' : 'inherit'}
                style={styles.rounds.label}
              >
                {game?.completed
                  ? 'Game Over'
                  : `Round ${rounds.length} of ${ROUNDS_LIMIT}`
                }
              </Typography>
              {!game?.completed &&
                <MobileStepper
                  variant="dots"
                  position="static"
                  steps={ROUNDS_LIMIT}
                  activeStep={rounds.length - 1}
                  style={styles.rounds.stepper}
                />
              }
            </>
          }
        </Grid>
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
  } = useAsync(() => categoryID && loadPlaylists(categoryID), [categoryID]);
  const loading = gameLoading || categoriesLoading || playlistsLoading;

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
            </div>
          ) : (
            <Typography variant="h3" color="secondary" style={{ margin: 'auto' }}>
              Game not found
            </Typography>
          ))
      }
  
      <AppBar color="default" position="static" style={{ padding: '16px 0' }}>
        <Toolbar>
          <Players gameRef={gameRef} />
        </Toolbar>
      </AppBar>
    </div>
  );
};

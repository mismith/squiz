import React from 'react';
import { Link } from 'react-router-dom';
import { useDocumentData, useCollectionData } from 'react-firebase-hooks/firestore';
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
import { usePromised } from '../helpers/util';
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
    marginLeft: 'auto',
    marginRight: 16,
  },
  stepper: {
    background: 'transparent',
  },
};

export default ({ gameID, categoryID, playlistID, match }) => {
  const gameRef = firestore.collection('games').doc(gameID);
  const { value: game, gameLoading } = useDocumentData(gameRef, null, 'id');
  const { value: rounds } = useCollectionData(gameRef.collection('rounds'));

  const [categories, categoriesLoading] = usePromised(() => loadCategories(), []);
  const [playlists, playlistsLoading] = usePromised(() => categoryID && loadPlaylists(categoryID), [categoryID]);
  const loading = gameLoading
    || (!categoryID && categoriesLoading)
    || (categoryID && playlistsLoading);

  const childProps = {
    gameID,
    categoryID,
    categories,
    playlistID,
    playlists,
    gameRef,
    match,
  };

  const BackButton = (props) => {
    let to = '';
    if (gameID && categoryID) {
      to += `/games/${gameID}`;
    }
    if (categoryID && playlistID) {
      to += `/${categoryID}`;
    }
    return (
      <Button component={Link} to={to} {...props}>
        {!categoryID ? (
          <CloseIcon style={{marginRight: 8}} />
        ) : (
          <ArrowBackIosIcon style={{marginRight: 8}} />
        )}
        {!categoryID ? 'Exit' : 'Back'}
      </Button>
    );
  };

  const Body = () => {
    if (loading) {
      return (
        <Loader />
      );
    }
    if (game && !game.id) {
      return (
        <Typography variant="h3" color="secondary" style={{margin: 'auto'}}>
          Game not found
        </Typography>
      );
    }

    const Content = () => {
      if (playlistID) {
        return (
          <TrackList {...childProps} />
        );
      }
      if (categoryID) {
        return (
          <PlaylistList {...childProps} />
        );
      }
      return (
        <CategoryList {...childProps} />
      );
    };
    return (
      <div style={styles.content}>
        <Content />
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <AppBar color="default" position="static">
        <Toolbar style={{justifyContent: 'center'}}>
          <Grid item xs={4}>
            <BackButton />
          </Grid>

          <GameCode gameID={gameID} />

          <Grid item container xs={4}>
            {rounds && !!rounds.length &&
              <>
                <Typography
                  variant="overline"
                  component="small"
                  color={game && game.completed ? 'secondary' : 'default'}
                  style={styles.rounds}
                >
                  {game && game.completed
                    ? 'Game Over'
                    : `Round ${rounds.length} of ${ROUNDS_LIMIT}`
                  }
                </Typography>
                {game && !game.completed &&
                  <MobileStepper
                    variant="dots"
                    position="static"
                    steps={ROUNDS_LIMIT}
                    activeStep={rounds.length - 1}
                    style={styles.stepper}
                  />
                }
              </>
            }
          </Grid>
        </Toolbar>
      </AppBar>

      <Body />
  
      <AppBar color="default" position="static" style={{padding: '16px 0'}}>
        <Toolbar>
          <Players {...childProps} />
        </Toolbar>
      </AppBar>
    </div>
  );
};

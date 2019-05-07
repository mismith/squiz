import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useDocumentData } from 'react-firebase-hooks/firestore';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
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
};

export default ({ gameID, categoryID, playlistID, match }) => {
  const gameRef = firestore.collection('games').doc(gameID);
  const { value: game, gameLoading } = useDocumentData(gameRef, null, 'id');

  // @TODO: why are these firing even when the deps don't change
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

  const BackButton = (props) => (
    <Button component={Link} to={categoryID ? '.' : '..'} {...props}>
      {!categoryID ? (
        <CloseIcon style={{marginRight: 8}} />
      ) : (
        <ArrowBackIosIcon style={{marginRight: 8}} />
      )}
      {!categoryID ? 'Exit' : 'Back'}
    </Button>
  );
  const body = useMemo(() => {
    if (loading) {
      return (
        <Loader />
      );
    }
    if (game && !game.timestamp) {
      return (
        <Typography variant="h3" color="secondary" style={{margin: 'auto'}}>
          Game not found
        </Typography>
      );
    }
    const Content = () => {
      if (game && game.completed) {
        return (
          <Typography variant="h3" color="secondary" style={{margin: 'auto'}}>
            Game Over!
          </Typography>
        );
      }
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
  }, [
    !loading && game && game.id,
    !loading && game && game.completed,
    !loading && categoryID,
    !loading && playlistID,
  ]);

  return (
    <div style={styles.container}>
      <AppBar color="default" position="static">
        <Toolbar style={{justifyContent: 'center'}}>
          <BackButton />

          <GameCode gameID={gameID} />

          {/* to even out whitespace and maintain random button horizontal centering */}
          <BackButton style={{visibility: 'hidden'}} />
        </Toolbar>
      </AppBar>

      {body}
  
      <AppBar color="default" position="static" style={{padding: '16px 0'}}>
        <Toolbar>
          <Players {...childProps} />
        </Toolbar>
      </AppBar>
    </div>
  );
};

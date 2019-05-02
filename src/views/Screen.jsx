import React, { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useDocumentData } from 'react-firebase-hooks/firestore';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import ArrowBackIosIcon from '@material-ui/icons/ArrowBackIos';

import CategoryList from '../components/CategoryList';
import PlaylistList from '../components/PlaylistList';
import TrackList from '../components/TrackList';
import Players from '../components/Players';
import Loader from '../components/Loader';
import { retrieveAccessToken } from '../helpers/spotify';
import { firestore } from '../helpers/firebase';

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
  const { value: game, loading } = useDocumentData(gameRef, null, 'id');

  const childProps = {
    gameID,
    categoryID,
    playlistID,
    gameRef,
    match,
  };

  useEffect(() => {
    retrieveAccessToken();
  }, []);

  const BackButton = (props) => (
    <Button component={Link} to={categoryID ? '.' : '..'} {...props}>
      <ArrowBackIosIcon style={{marginRight: 8}} />
      Back
    </Button>
  );
  const body = useMemo(() => {
    if (loading) {
      return (
        <Loader />
      );
    }
    if (!game.timestamp) {
      return (
        <Typography variant="h3" color="secondary" style={{margin: 'auto'}}>
          Game not found
        </Typography>
      );
    }
    const Content = () => {
      if (game.completed) {
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
    game && game.id,
    game && game.completed,
    categoryID,
    playlistID,
    loading,
  ]);

  return (
    <div style={styles.container}>
      <AppBar color="default" position="static">
        <Toolbar style={{justifyContent: 'center'}}>
          <BackButton />

          <div style={{textAlign: 'center', margin: 'auto'}}>
            <Typography variant="h4">{gameID}</Typography>
            <Typography color="textSecondary" style={{fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 'bold'}}>Game Code</Typography>
          </div>

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

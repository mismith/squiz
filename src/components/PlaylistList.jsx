import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Toolbar from '@material-ui/core/Toolbar';
import Button from '@material-ui/core/Button';
import ShuffleIcon from '@material-ui/icons/Shuffle';

import Loader from './Loader';
import TileGrid from './TileGrid';
import TileButton from './TileButton';
import { retrieveAccessToken, loadPlaylists } from '../helpers/spotify';
import { usePromised } from '../helpers/util';
import { getRandomID } from '../helpers/game';

export default ({ categoryID, match }) => {
  const [playlists, loading] = usePromised(() => loadPlaylists(categoryID), [categoryID], []);

  useEffect(() => {
    retrieveAccessToken();
  }, []);

  if (loading) {
    return (
      <Loader />
    );
  }

  return (
    <>
      <Toolbar>
        <Button
          component={Link}
          to={`${match.url}/${getRandomID(playlists) || ''}`}
          style={{marginLeft: 'auto', marginRight: 'auto'}}
        >
          <ShuffleIcon style={{marginRight: 16}} />
          Random
        </Button>
      </Toolbar>
      <TileGrid>
        {playlists.map(playlist =>
          <TileButton
            key={playlist.id}
            image={playlist.images[0].url}
            component={Link}
            to={`${match.url}/${playlist.id}`}
          />
        )}
      </TileGrid>
    </>
  );
};

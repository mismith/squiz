import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Toolbar from '@material-ui/core/Toolbar';
import Button from '@material-ui/core/Button';
import ShuffleIcon from '@material-ui/icons/Shuffle';

import TileGrid from './TileGrid';
import TileButton from './TileButton';
import { retrieveAccessToken, loadPlaylists } from '../helpers/spotify';
import { getRandomID } from '../helpers/game';

export default ({ categoryID, match }) => {
  const [playlists, setPlaylists] = useState([]);

  useEffect(() => {
    retrieveAccessToken();
  }, []);
  useEffect(() => {
    loadPlaylists(categoryID).then(setPlaylists);
  }, [categoryID]);

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

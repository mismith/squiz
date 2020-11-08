import React from 'react';
import { Link, useRouteMatch } from 'react-router-dom';
import { useAsync } from 'react-async-hook';
import Toolbar from '@material-ui/core/Toolbar';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import ShuffleIcon from '@material-ui/icons/Shuffle';

import TileGrid from './TileGrid';
import TileButton from './TileButton';
import Loader from './Loader';
import { getRandomID } from '../helpers/game';
import { loadCategoryPlaylists } from '../helpers/spotify';

export default function PlaylistList() {
  const { url, params: { categoryID } } = useRouteMatch();
  const { result: playlists, loading } = useAsync(loadCategoryPlaylists, [categoryID]);
  
  if (loading) {
    return (
      <Loader />
    );
  }
  return (
    <>
      {playlists.length ? (
        <>
          <Toolbar>
            <Button
              component={Link}
              to={`${url}/${getRandomID(playlists) || ''}`}
              style={{ marginLeft: 'auto', marginRight: 'auto' }}
            >
              <ShuffleIcon style={{ marginRight: 16 }} />
              Random
            </Button>
          </Toolbar>
          <TileGrid style={{ flex: 'auto', marginBottom: 16 }}>
            {playlists.map(playlist =>
              <TileButton
                key={playlist.id}
                image={playlist.images[0].url}
                component={Link}
                to={`${url}/${playlist.id}`}
              />
            )}
          </TileGrid>
        </>
      ) : (
        <Typography variant="h3" color="secondary" style={{ margin: 'auto' }}>
          Nothing found
        </Typography>
      )}
    </>
  );
}

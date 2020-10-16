import React from 'react';
import { Link } from 'react-router-dom';
import Toolbar from '@material-ui/core/Toolbar';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import ShuffleIcon from '@material-ui/icons/Shuffle';

import TileGrid from './TileGrid';
import TileButton from './TileButton';
import { getRandomID } from '../helpers/game';

export default ({ playlists = [], match }) => playlists.length ? (
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
    <TileGrid style={{flex: 'auto'}}>
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
) : (
  <Typography variant="h3" color="secondary" style={{margin: 'auto'}}>
    Nothing found
  </Typography>
);

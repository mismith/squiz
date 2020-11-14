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
import { loadCategories } from '../helpers/spotify';

export default function CategoryList() {
  const { url } = useRouteMatch();
  const { result: categories = [], loading, error } = useAsync(loadCategories, []);
  
  if (loading || error) {
    return (
      <Loader />
    );
  }
  return (
    <>
      {categories.length ? (
        <>
          <Toolbar>
            <Button
              component={Link}
              to={`${url}/${getRandomID(categories) || ''}`}
              style={{ marginLeft: 'auto', marginRight: 'auto' }}
            >
              <ShuffleIcon style={{ marginRight: 16 }} />
              Random
            </Button>
          </Toolbar>
          <TileGrid style={{ flex: 'auto', marginBottom: 16 }}>
            {categories.map(category =>
              <TileButton
                key={category.id}
                label={category.name}
                image={category.icons[0].url}
                component={Link}
                to={`${url}/${category.id}`}
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

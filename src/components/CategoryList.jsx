import React from 'react';
import { Link } from 'react-router-dom';
import Toolbar from '@material-ui/core/Toolbar';
import Button from '@material-ui/core/Button';
import ShuffleIcon from '@material-ui/icons/Shuffle';

import Loader from './Loader';
import TileGrid from './TileGrid';
import TileButton from './TileButton';
import { loadCategories } from '../helpers/spotify';
import { usePromised } from '../helpers/util';
import { getRandomID } from '../helpers/game';

export default ({ match }) => {
  const [categories, loading] = usePromised(() => loadCategories(), [], []);

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
          to={`${match.url}/${getRandomID(categories) || ''}`}
          style={{marginLeft: 'auto', marginRight: 'auto'}}
        >
          <ShuffleIcon style={{marginRight: 16}} />
          Random
        </Button>
      </Toolbar>
      <TileGrid>
        {categories.map(category =>
          <TileButton
            key={category.id}
            title={category.name}
            image={category.icons[0].url}
            component={Link}
            to={`${match.url}/${category.id}`}
          />
        )}
      </TileGrid>
    </>
  );
};

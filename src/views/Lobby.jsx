import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Toolbar from '@material-ui/core/Toolbar';
import Card from '@material-ui/core/Card';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import SvgIcon from '@material-ui/core/SvgIcon';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import ArrowBackIosIcon from '@material-ui/icons/ArrowBackIos';
import ShuffleIcon from '@material-ui/icons/Shuffle';
import shuffleArray from 'shuffle-array';

import SpotifyButton from '../components/SpotifyButton';
import { retrieveAccessToken } from '../helpers/spotify';

export default (props) => {
  useEffect(() => {
    retrieveAccessToken();
  }, []);

  return (
    <div>
      <Button component={Link} to={`/games/1/players/1`}>Join</Button>
      <Button component={Link} to={`/games/1/screen`}>Host</Button>
    </div>
  );
};

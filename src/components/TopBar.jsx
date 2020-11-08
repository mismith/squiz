import React, { useState } from 'react';
import { Link, useHistory, useRouteMatch } from 'react-router-dom';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import CloseIcon from '@material-ui/icons/Close';
import ArrowBackIosIcon from '@material-ui/icons/ArrowBackIos';
import Home from '@material-ui/icons/Home';

import GameInfo from '../components/GameInfo';
import DialogConfirm from '../components/DialogConfirm';
import { endGame, useGame } from '../helpers/game';

export default function TopBar(props) {
  const { params: { gameID, categoryID, playlistID } } = useRouteMatch();
  const [, gameRef] = useGame();

  let to = '';
  if (gameID && categoryID) {
    to += `/games/${gameID}`;
  }
  if (categoryID && playlistID) {
    to += `/${categoryID}`;
  }

  const history = useHistory();
  const [confirmQuit, setConfirmQuit] = useState(false);
  const handleCancelQuit = () => setConfirmQuit(false);
  const handleConfirmQuit = async () => {
    await endGame(gameRef);
    handleCancelQuit();
    history.push('/');
  };

  return (
    <AppBar color="default" position="static" {...props}>
      <Toolbar style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
        <Grid item xs={2}>
          {to ? (
            <Button component={Link} to={to}>
              <ArrowBackIosIcon style={{ marginRight: 8 }} />
              Back
            </Button>
          ) : (
            <Button component={Link} to="/">
              <Home style={{ marginRight: 8 }} />
              Home
            </Button>
          )}
        </Grid>

        <Grid item container xs>
          <GameInfo name="Game Site" value={window.location.host} color="primary" />
          <GameInfo name="Game Code" value={gameID} color="secondary" />
        </Grid>

        <Grid item container xs={2} justify="flex-end">
          <Button onClick={() => setConfirmQuit(true)}>
            <CloseIcon style={{ marginRight: 8 }} />
            Quit
          </Button>
          <DialogConfirm
            open={Boolean(confirmQuit)}
            title="Quit Game"
            body="Are you sure you want to permanently end this game for all players?"
            onCancel={handleCancelQuit}
            onConfirm={handleConfirmQuit}
          />
        </Grid>
      </Toolbar>
    </AppBar>
  );
}

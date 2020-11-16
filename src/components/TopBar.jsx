import React, { useState } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { useObjectVal } from 'react-firebase-hooks/database';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Grid from '@material-ui/core/Grid';
import CloseIcon from '@material-ui/icons/Close';
import ArrowBackIosIcon from '@material-ui/icons/ArrowBackIos';
import Home from '@material-ui/icons/Home';
import Skeleton from '@material-ui/lab/Skeleton';

import GameInfo from './GameInfo';
import DialogConfirm from './DialogConfirm';
import ResponsiveButton from './ResponsiveButton';
import useRouteParams from '../hooks/useRouteParams';
import { endGame, removePlayer } from '../helpers/game';
import { refs, keyField } from '../helpers/firebase';

export function PlayerName({ playerRef }) {
  const [player, loading] = useObjectVal(playerRef);

  return loading ? <Skeleton variant="text" width={100} /> : <>{player?.name}</>;
}

export default function TopBar(props) {
  const { gameID, categoryID, playlistID, playerID } = useRouteParams();
  const [game] = useObjectVal(refs.game(gameID), { keyField });

  let to = '';
  if (!game?.completed) {
    if (gameID && categoryID) {
      to += `/games/${gameID}`;
    }
    if (categoryID && playlistID) {
      to += `/${categoryID}`;
    }
  }

  const playerRef = playerID && refs.player(gameID, playerID);

  const history = useHistory();
  const [confirmQuit, setConfirmQuit] = useState(false);
  const handleCancelQuit = () => setConfirmQuit(false);
  const handleConfirmQuit = async () => {
    if (playerID) {
      await removePlayer(gameID, playerID);
    } else {
      await endGame(gameID);
    }
    handleCancelQuit();
    history.push('/');
  };

  return (
    <AppBar color="default" position="static" {...props}>
      <Toolbar>
        <Grid item xs={2}>
          {to ? (
            <ResponsiveButton component={Link} to={to} Icon={ArrowBackIosIcon}>
              Back
            </ResponsiveButton>
          ) : (
            <ResponsiveButton component={Link} to="/" Icon={Home}>
              Home
            </ResponsiveButton>
          )}
        </Grid>

        <Grid item container xs style={{ overflow: 'hidden' }}>
          <GameInfo name="Game Site" value={window.location.host} color="primary" />
          <GameInfo name="Game Code" value={gameID} color="secondary" />
          {playerRef && (
            <GameInfo name="Your Name" value={<PlayerName playerRef={playerRef} />} />
          )}
        </Grid>

        <Grid item container xs={2} justify="flex-end">
          <Button onClick={() => setConfirmQuit(true)}>
            <CloseIcon style={{ marginRight: 8 }} />
            Quit
          </Button>
          <DialogConfirm
            open={Boolean(confirmQuit)}
            title="Quit Game"
            body={`Are you sure you want to permanently ${playerID ? 'leave this game' : 'end this game for all players'}?`}
            onCancel={handleCancelQuit}
            onConfirm={handleConfirmQuit}
          />
        </Grid>
      </Toolbar>
    </AppBar>
  );
}

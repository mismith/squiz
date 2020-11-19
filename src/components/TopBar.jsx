import React, { useState } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { useObjectVal } from 'react-firebase-hooks/database';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Grid from '@material-ui/core/Grid';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import CloseIcon from '@material-ui/icons/Close';
import ArrowBackIosIcon from '@material-ui/icons/ArrowBackIos';
import Home from '@material-ui/icons/Home';
import MoreVert from '@material-ui/icons/MoreVert';
import SlowMotionVideo from '@material-ui/icons/SlowMotionVideo';
import Skeleton from '@material-ui/lab/Skeleton';

import GameInfo from './GameInfo';
import DialogConfirm from './DialogConfirm';
import ResponsiveButton from './ResponsiveButton';
import useRouteParams from '../hooks/useRouteParams';
import { removePlayer, removeGame, useUsedTrackIDs } from '../helpers/game';
import { refs, keyField } from '../helpers/firebase';

export function PlayerName({ playerRef }) {
  const [player, loading] = useObjectVal(playerRef);

  return loading ? <Skeleton variant="text" width={100} /> : <>{player?.name}</>;
}

export function GameMenu({ ...props }) {
  const { gameID, playerID } = useRouteParams();

  const [anchorEl, setAnchorEl] = useState(null);
  const isOpen = Boolean(anchorEl);
  const handleClose = () => setAnchorEl(null);

  const [usedTrackIDs, setUsedTrackIDs] = useUsedTrackIDs();
  const [confirmReset, setConfirmReset] = useState(false);
  const handleCancelReset = () => setConfirmReset(false);
  const handleConfirmReset = async () => {
    setUsedTrackIDs('');
    handleCancelReset();
  };

  const history = useHistory();
  const [confirmQuit, setConfirmQuit] = useState(false);
  const handleCancelQuit = () => setConfirmQuit(false);
  const handleConfirmQuit = async () => {
    if (playerID) {
      await removePlayer(gameID, playerID);
    } else {
      await removeGame(gameID);
    }
    history.push('/');
  };

  return (
    <>
      <ResponsiveButton
        Icon={MoreVert}
        ref={anchorEl}
        onClick={({ currentTarget }) => setAnchorEl(currentTarget)}
        {...props}
      >
        Menu
      </ResponsiveButton>

      <Menu open={isOpen} anchorEl={anchorEl} onClose={handleClose}>
        <MenuItem onClick={() => { setConfirmQuit(true); handleClose(); }}>
          <CloseIcon style={{ marginRight: 8 }} />
          {playerID ? 'Leave' : 'End'} Game
        </MenuItem>

        {Boolean(usedTrackIDs && !playerID) && (
          <MenuItem onClick={() => { setConfirmReset(true); handleClose(); }}>
            <SlowMotionVideo style={{ marginRight: 8 }} />
            Reset Used Tracks
          </MenuItem>
        )}
      </Menu>
      
      <DialogConfirm
        open={Boolean(confirmReset)}
        title="Reset Used Tracks"
        body={<>By resetting the tracks used, songs you have heard before may appear as correct answers in future rounds.<br /><br />Are you sure you want to potentially see repeat tracks?</>}
        onCancel={handleCancelReset}
        onConfirm={handleConfirmReset}
      />
      
      <DialogConfirm
        open={Boolean(confirmQuit)}
        title="Quit Game"
        body={`Are you sure you want to permanently ${playerID ? 'leave this game' : 'end this game for all players'}?`}
        onCancel={handleCancelQuit}
        onConfirm={handleConfirmQuit}
      />
    </>
  );
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
          <GameMenu />
        </Grid>
      </Toolbar>
    </AppBar>
  );
}

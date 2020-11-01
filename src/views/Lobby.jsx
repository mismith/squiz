import React, { useState, useEffect, useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import useForm from 'react-hook-form'
import useLocalStorage from 'react-use-localstorage';
import { useAsync } from 'react-async-hook';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import IconButton from '@material-ui/core/IconButton';
import InputAdornment from '@material-ui/core/InputAdornment';
import Clear from '@material-ui/icons/Clear';
import Shuffle from '@material-ui/icons/Shuffle';

import SpotifyButton from '../components/SpotifyButton';
import SpotifyLoginButton from '../components/SpotifyLoginButton';
import About from '../components/About';
import { firestore, FieldValue } from '../helpers/firebase';
import { login, retrieveAccessToken } from '../helpers/spotify';
import { makeStyles } from '@material-ui/core';

function useRandomName() {
  const [remainingRandomNames, setRemainingRandomNames] = useState([]);
  useAsync(async () => {
    if (!remainingRandomNames.length) {
      const url = 'http://names.drycodes.com/25?nameOptions=funnyWords';
      const names = await (await fetch(`https://cors-anywhere.herokuapp.com/${url}`)).json();
      setRemainingRandomNames(names);
    }
  }, [remainingRandomNames.length]);

  const getRandomName = () => {
    const nextRandomName = remainingRandomNames.splice(0, 1);
    setRemainingRandomNames(remainingRandomNames);
    return nextRandomName;
  };

  getRandomName.remaining = remainingRandomNames;

  return getRandomName;
}

const useStyles = makeStyles(theme => ({
  root: {
    flexShrink: 0,
    flexWrap: 'nowrap',
    padding: theme.spacing(4),
  },
  about: {
    borderTop: `solid 1px ${theme.palette.text.disabled}`,
    padding: theme.spacing(6, 0),
  },
}));

export default function Lobby() {
  const classes = useStyles();

  const { register, handleSubmit, errors } = useForm();
  const [joinGameID, setJoinGameID] = useLocalStorage('joinGameID');
  const [playerName, setPlayerName] = useLocalStorage('playerName');
  const [hostGameID, setHostGameID] = useLocalStorage('hostGameID');
  const [gameIDError, setGameIDError] = useState('');
  const [playerNameError, setPlayerNameError] = useState('');
  const [joinGameLoading, setJoinGameLoading] = useState(false);
  const [hostGameLoading, setHostGameLoading] = useState(false);

  const gamesRef = firestore.collection('games');

  const history = useHistory();
  async function joinGame({ joinGameID }) {
    if (joinGameLoading) return;
    setJoinGameLoading(true);

    const gameRef = gamesRef.doc(joinGameID);
    const gameDoc = await gameRef.get();
    if (!gameDoc.exists) {
      setJoinGameLoading(false);
      setGameIDError('Not found');
      return;
    }

    const playersRef = gameRef.collection('players');
    const playerNames = (await playersRef.get()).docs.map(d => (d.data() || {}).name);
    if (playerName && playerNames.includes(playerName)) {
      setJoinGameLoading(false);
      setPlayerNameError('A player is already using this name');
      return;
    }
    const { id: newPlayerID } = await playersRef.add({
      name: playerName,
      timestamp: FieldValue.serverTimestamp(),
    });
    setJoinGameLoading(false);
    history.push(`/games/${joinGameID}/players/${newPlayerID}`);
  }
  const hostGame = useCallback(async () => {
    if (hostGameLoading) return;
    setHostGameLoading(false);

    const { accessToken } = retrieveAccessToken();
    if (!accessToken) {
      setHostGameLoading(false);
      login('hostGame');
      return;
    }

    // resume existing (uncompleted) game first, if applicable
    let newGameID;
    if (hostGameID) {
      const game = await gamesRef.doc(hostGameID).get();
      if (game.exists) {
        const { completed } = game.data();
        if (!completed) {
          // game exists and is still in progress, so resume
          newGameID = hostGameID;
        }
      } else {
        // game doesn't exist, so we can reuse the stored gameID
        newGameID = hostGameID;
      }
    }
    // otherwise, find an unused gameID
    if (!newGameID) {
      const findUnusedGameID = async () => {
        newGameID = `${Math.round(Math.random() * 8999) + 1000}`; // [1000, 9999]
        const { exists } = await gamesRef.doc(newGameID).get();
        if (exists) await findUnusedGameID();
      };
      await findUnusedGameID();
    }
    // start game
    await gamesRef.doc(newGameID).set({
      // @TODO
      timestamp: FieldValue.serverTimestamp(),
    });
    setHostGameID(newGameID);
    setHostGameLoading(false);
    history.push(`/games/${newGameID}`);
  }, [gamesRef, history, hostGameID, hostGameLoading, setHostGameID]);

  useEffect(() => {
    const { state } = retrieveAccessToken();
    if (state) {
      window.location.hash = '';
      if (state === 'hostGame') {
        hostGame();
      } else if (state[0] === '/') {
        history.replace(state);
      }
    }
  }, [history, hostGame]);

  const getRandomName = useRandomName();

  return (
    <Grid container direction="column" alignItems="center" justify="center" className={classes.root}>
      <Grid
        component="form"
        item
        container
        direction="column"
        spacing={2}
        style={{ maxWidth: 400, marginBottom: 48 }}
        onSubmit={handleSubmit(joinGame)}
      >
        <Grid item>
          <Typography variant="h2" component="h1" style={{ textAlign: 'center', marginBottom: 16 }}>
            Squiz
          </Typography>
          <Typography variant="h6" style={{ textAlign: 'center', marginBottom: 16 }}>
            Beat your friends to name that tune!
          </Typography>
        </Grid>
        <Grid item>
          <TextField
            label="Game Code"
            variant="outlined"
            fullWidth
            autoComplete="off"
            inputRef={register({
              required: 'Required',
              pattern: { value: /^\d{4}$/, message: 'Invalid: should be a 4-digit number' },
            })}
            inputProps={{name: 'joinGameID'}}
            error={!!(errors.joinGameID || gameIDError)}
            helperText={errors.joinGameID ? errors.joinGameID.message : gameIDError}
            value={joinGameID}
            onInput={() => setGameIDError('')}
            onChange={event => setJoinGameID(event.target.value)}
            InputProps={{
              endAdornment: Boolean(joinGameID) && (
                <InputAdornment position="end">
                  <IconButton edge="end" onClick={() => setJoinGameID('')}>
                    <Clear />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
        </Grid>
        <Grid item>
          <TextField
            label="Your Name"
            variant="outlined"
            fullWidth
            inputRef={register({
              required: 'Required',
            })}
            inputProps={{name: 'playerName'}}
            error={!!(errors.playerName || playerNameError)}
            helperText={errors.joinGameID ? errors.joinGameID.message : playerNameError}
            value={playerName}
            onInput={() => setPlayerNameError('')}
            onChange={event => setPlayerName(event.target.value)}
            InputProps={{
              endAdornment: Boolean(playerName) ? (
                <InputAdornment position="end">
                  <IconButton edge="end" onClick={() => setPlayerName('')}>
                    <Clear />
                  </IconButton>
                </InputAdornment>
              ) : (Boolean(getRandomName?.remaining?.length) && (
                <InputAdornment position="end">
                  <IconButton edge="end" onClick={() => setPlayerName(getRandomName())}>
                    <Shuffle style={{ transform: 'rotate(180deg)' }} />
                  </IconButton>
                </InputAdornment>
              ))
            }}
          />
        </Grid>
        <Grid item>
          <SpotifyButton type="submit" fullWidth loading={joinGameLoading}>
            Join Game
          </SpotifyButton>
        </Grid>
        <Grid item container justify="center" style={{ padding: 16, opacity: 0.5 }}>
          <Typography>&mdash; or &mdash;</Typography>
        </Grid>
        <Grid item>
          <SpotifyLoginButton
            variant="outlined"
            fullWidth
            loading={hostGameLoading}
            onClick={hostGame}
          >
            Host Game with Spotify
          </SpotifyLoginButton>
        </Grid>
      </Grid>
      <Grid item container direction="column" alignItems="center" className={classes.about}>
        <About />
      </Grid>
    </Grid>
  );
}

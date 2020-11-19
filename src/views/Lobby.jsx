import React, { useState, useEffect, useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import useForm from 'react-hook-form'
import useLocalStorageState from 'use-local-storage-state';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import IconButton from '@material-ui/core/IconButton';
import InputAdornment from '@material-ui/core/InputAdornment';
import { makeStyles } from '@material-ui/core/styles';
import Clear from '@material-ui/icons/Clear';
import Shuffle from '@material-ui/icons/Shuffle';

import SpotifyButton from '../components/SpotifyButton';
import SpotifyLoginButton from '../components/SpotifyLoginButton';
import About from '../components/About';
import { refs, ServerValue } from '../helpers/firebase';
import { login, retrieveAccessToken } from '../helpers/spotify';
import { gameIDRegex, generateGameID, startGame } from '../helpers/game';
import useRandomName from '../hooks/useRandomName';

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
  const [joinGameID, setJoinGameID] = useLocalStorageState('joinGameID');
  const [playerName, setPlayerName] = useLocalStorageState('playerName');
  const [storedPlayerID, setPlayerID] = useLocalStorageState('playerID');
  const [hostGameID, setHostGameID] = useLocalStorageState('hostGameID');
  const [gameIDError, setGameIDError] = useState('');
  const [playerNameError, setPlayerNameError] = useState('');
  const [joinGameLoading, setJoinGameLoading] = useState(false);
  const [hostGameLoading, setHostGameLoading] = useState(false);

  const history = useHistory();
  async function joinGame({ joinGameID }) {
    if (joinGameLoading) return;
    setJoinGameLoading(true);

    if (!(await refs.game(joinGameID).once('value')).exists()) {
      setJoinGameLoading(false);
      setGameIDError('Not found');
      return;
    }

    const trimmedPlayerName = String(playerName || '').trim();
    if (!trimmedPlayerName.length) {
      setJoinGameLoading(false);
      setPlayerNameError('Required');
      return;
    }

    if (trimmedPlayerName.length > 48) {
      setJoinGameLoading(false);
      setPlayerNameError('Must be shorter than 48 characters');
      return;
    }

    const playersRef = refs.players(joinGameID);
    const players = (await playersRef.once('value')).val() || {};
    const playerUsingNameID = Object.entries(players).find(
      ([, p]) => p?.name === trimmedPlayerName
    )?.[0];
    const handleDuplicateName = () => {
      setJoinGameLoading(false);
      setPlayerNameError('A player is already using this name');
    };
    const playerData = {
      name: trimmedPlayerName,
      timestamp: ServerValue.TIMESTAMP,
    };
    let playerID;
    if (storedPlayerID && Object.keys(players).find(key => key === storedPlayerID)) {
      if (playerUsingNameID && playerUsingNameID !== storedPlayerID) {
        return handleDuplicateName();
      }

      await playersRef.child(storedPlayerID).update(playerData);

      playerID = storedPlayerID;
    } else {
      if (playerUsingNameID) {
        return handleDuplicateName();
      }

      const { key: newPlayerID } = await playersRef.push(playerData);
      setPlayerID(newPlayerID);

      playerID = newPlayerID;
    }

    setJoinGameLoading(false);
    history.push(`/games/${joinGameID}/players/${playerID}`);
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
      const game = (await refs.game(hostGameID).once('value')).val();
      if (game) {
        if (!game.completed) {
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
        newGameID = generateGameID();
        const gameExists = (await refs.game(newGameID).once('value')).exists();
        if (gameExists) await findUnusedGameID();
      };
      await findUnusedGameID();
    }
    // start game
    await startGame(newGameID);
    setHostGameID(newGameID);
    setHostGameLoading(false);
    history.push(`/games/${newGameID}`);
  }, [history, hostGameID, hostGameLoading, setHostGameID]);

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

  const [getRandomName, randomNamesRemaining] = useRandomName();

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
              pattern: { value: gameIDRegex, message: 'Invalid: should be a 4-digit number' },
            })}
            inputProps={{ name: 'joinGameID' }}
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
            inputProps={{ name: 'playerName' }}
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
              ) : (Boolean(randomNamesRemaining?.length) && (
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

import React, { useState, useEffect } from 'react';
import useForm from 'react-hook-form'
import useLocalStorage from 'react-use-localstorage';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';

import SpotifyButton from '../components/SpotifyButton';
import SpotifyLoginButton from '../components/SpotifyLoginButton';
import { firestore } from '../helpers/firebase';
import { login, retrieveAccessToken } from '../helpers/spotify';

export default ({ history }) => {
  useEffect(() => {
    const { state } = retrieveAccessToken();
    if (state === 'hostGame') {
      hostGame();
    }
    if (state && state[0] === '/') {
      history.replace(state);
    }
  }, []);

  const { register, handleSubmit, errors } = useForm();
  const [playerName, setPlayerName] = useLocalStorage('playerName');
  const [hostGameID, setHostGameID] = useLocalStorage('hostGameID');
  const [gameIDError, setGameIDError] = useState('');
  const [loading, setLoading] = useState({ join: false, host: false });

  const gamesRef = firestore.collection('games');

  async function joinGame({ joinGameID }) {
    if (loading.join) return;
    setLoading({ join: true });

    const gameRef = gamesRef.doc(joinGameID);
    const gameDoc = await gameRef.get();
    if (!gameDoc.exists) {
      setLoading({ join: false });
      setGameIDError('Not found');
      return;
    }

    const { id: newPlayerID } = await gameRef.collection('players').add({
      // @TODO
      name: playerName,
      timestamp: Date.now(),
    });
    history.push(`/games/${joinGameID}/players/${newPlayerID}`);
    setLoading({ join: false });
  }
  async function hostGame(forceLogin = false) {
    if (loading.host) return;
    setLoading({ host: true });

    const { accessToken } = retrieveAccessToken();
    if (!accessToken || forceLogin) {
      setLoading({ host: false });
      login('hostGame');
      return;
    }

    // @TODO: check that this game isn't completed first
    const newGameID = hostGameID || `${Math.round(Math.random() * 8999) + 1000}`; // [1000, 9999]
    await gamesRef.doc(newGameID).set({
      // @TODO
      timestamp: Date.now(),
    });
    history.push(`/games/${newGameID}`);
    setHostGameID(newGameID);
    setLoading({ host: false });
  }

  return (
    <form onSubmit={handleSubmit(joinGame)} style={{display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'auto'}}>
      <Grid container spacing={16} style={{maxWidth: 400, padding: 16, margin: 0}}>
        <Grid item xs={12}>
          <Typography variant="h2" component="h1" style={{textAlign: 'center', marginBottom: 16}}>
            Squiz
          </Typography>
          <Typography variant="h6" style={{textAlign: 'center', marginBottom: 16}}>
            Beat your friends to name that tune!
          </Typography>
        </Grid>
        <Grid item xs={12}>
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
            onChange={() => setGameIDError('')}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            label="Player Name"
            variant="outlined"
            fullWidth
            value={playerName}
            onChange={event => setPlayerName(event.target.value)}
          />
        </Grid>
        <Grid item xs={12}>
          <SpotifyButton type="submit" fullWidth loading={loading.join}>
            Join Game
          </SpotifyButton>
        </Grid>
        <Grid item container xs={12} justify="center" style={{padding: 16, opacity: 0.5}}>
          <Typography>&mdash; or &mdash;</Typography>
        </Grid>
        <Grid item xs={12}>
          <SpotifyLoginButton
            variant="outlined"
            fullWidth
            loading={loading.host}
            onClick={hostGame}
          >
            Host Game with Spotify
          </SpotifyLoginButton>
        </Grid>
      </Grid>
    </form>
  );
};

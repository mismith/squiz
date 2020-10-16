import React, { useState, useEffect } from 'react';
import useForm from 'react-hook-form'
import useLocalStorage from 'react-use-localstorage';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';

import SpotifyButton from '../components/SpotifyButton';
import SpotifyLoginButton from '../components/SpotifyLoginButton';
import { firestore, FieldValue } from '../helpers/firebase';
import { login, retrieveAccessToken } from '../helpers/spotify';

export default ({ history }) => {
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
  }, []);

  const { register, handleSubmit, errors } = useForm();
  const [joinGameID, setJoinGameID] = useLocalStorage('joinGameID');
  const [playerName, setPlayerName] = useLocalStorage('playerName');
  const [hostGameID, setHostGameID] = useLocalStorage('hostGameID');
  const [gameIDError, setGameIDError] = useState('');
  const [playerNameError, setPlayerNameError] = useState('');
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

    const playersRef = gameRef.collection('players');
    const playerNames = (await playersRef.get()).docs.map(d => (d.data() || {}).name);
    if (playerName && playerNames.includes(playerName)) {
      setLoading({ join: false });
      setPlayerNameError('A player is already using this name');
      return;
    }
    const { id: newPlayerID } = await playersRef.add({
      name: playerName,
      timestamp: FieldValue.serverTimestamp(),
    });
    setLoading({ join: false });
    history.push(`/games/${joinGameID}/players/${newPlayerID}`);
  }
  async function hostGame() {
    if (loading.host) return;
    setLoading({ host: true });

    const { accessToken } = retrieveAccessToken();
    if (!accessToken) {
      setLoading({ host: false });
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
    setLoading({ host: false });
    history.push(`/games/${newGameID}`);
  }

  return (
    <form onSubmit={handleSubmit(joinGame)} style={{display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'auto'}}>
      <Grid container spacing={2} style={{maxWidth: 400, padding: 16, margin: 0, marginBottom: 48}}>
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
            value={joinGameID}
            onInput={() => setGameIDError('')}
            onChange={event => setJoinGameID(event.target.value)}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            label="Player Name"
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

import firebase from 'firebase/app';
import 'firebase/database';

export const config = {
  apiKey: 'AIzaSyBsV2vcnGc5HoQm8dZuLS-svp8N5Z6jGkg',
  authDomain: 'squiz-9a2c0.firebaseapp.com',
  databaseURL: 'https://squiz-9a2c0.firebaseio.com',
  projectId: 'squiz-9a2c0',
  storageBucket: 'squiz-9a2c0.appspot.com',
  messagingSenderId: '521620949890',
  appId: '1:521620949890:web:1005adcb3041c685b65d9b',
  measurementId: 'G-RLXPT47RR7',
};
export const app = firebase.initializeApp(config);

export const { ServerValue } = firebase.database;
export const database = app.database();
export const refs = {
  games: () => database.ref('games'),
  game: gameID => refs.games().child(gameID),
  players: gameID => database.ref('games-players').child(gameID),
  player: (gameID, playerID) => refs.players(gameID).child(playerID),
  rounds: gameID => database.ref('games-rounds').child(gameID),
  round: (gameID, roundID) => refs.rounds(gameID).child(roundID),
  latestRound: gameID => refs.rounds(gameID).limitToLast(1),
  tracks: roundID => database.ref('rounds-tracks').child(roundID),
  track: (roundID, trackID) => refs.tracks(roundID).child(trackID),
  latestTrack: roundID => refs.tracks(roundID).limitToLast(1),
  guesses: trackID => database.ref('tracks-players').child(trackID),
  guess: (trackID, playerID) => refs.guesses(trackID).child(playerID),
};
export const keyField = 'id';

export default firebase;

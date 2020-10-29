import firebase from 'firebase/app';
import 'firebase/firestore';

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

export const { FieldValue } = firebase.firestore;
export const firestore = app.firestore();

export default firebase;

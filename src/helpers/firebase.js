import firebase from 'firebase/app';
import 'firebase/firestore';

export const config = {
  apiKey: 'AIzaSyCwAPZxgorwuqX_7gku1XD1UY3YbUyPbq4',
  authDomain: 'mismith.firebaseapp.com',
  databaseURL: 'https://mismith.firebaseio.com',
  projectId: 'firebase-mismith',
  storageBucket: 'firebase-mismith.appspot.com',
  messagingSenderId: '668345313266'
};
export const app = firebase.initializeApp(config);

export const firestore = app.firestore().collection('apps').doc('squiz');

export default firebase;

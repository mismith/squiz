import React from 'react';
import { BrowserRouter, Route } from 'react-router-dom';
import CssBaseline from '@material-ui/core/CssBaseline';
import Screen from './views/Screen';

export default () => (
  <BrowserRouter>
    <CssBaseline />
    {/* <Route
      path="/"
      exact
      render={props => <Screen {...props} />}
    /> */}
    <Route
      path="/:categoryID?/:playlistID?"
      exact
      render={props => <Screen {...props} {...props.match.params} playerID="screen" />}
    />
    {/* <Route
      path="/games/:gameID/players/:playerID"
      exact
      render={props => <Controller {...props} {...props.match.params} />}
    /> */}
  </BrowserRouter>
);

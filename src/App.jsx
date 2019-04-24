import React from 'react';
import { BrowserRouter, Switch, Route, Redirect } from 'react-router-dom';
import CssBaseline from '@material-ui/core/CssBaseline';
import Lobby from './views/Lobby';
import Screen from './views/Screen';
import Controller from './views/Controller';

export default () => (
  <BrowserRouter>
    <CssBaseline />
    <Switch>
      <Route
        exact
        strict
        path="/:url+/"
        render={props => <Redirect to={props.location.pathname.replace(/\/$/, '')}/>}
      />
      <Route
        path="/games/:gameID/players/:playerID"
        render={props => <Controller {...props} {...props.match.params} />}
      />
      <Route
        path="/games/:gameID/:categoryID?/:playlistID?"
        render={props => <Screen {...props} {...props.match.params} playerID="screen" />}
      />
      <Route
        path="/"
        render={props => <Lobby {...props} />}
      />
    </Switch>
  </BrowserRouter>
);

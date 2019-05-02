import React from 'react';
import { BrowserRouter, Switch, Route, Redirect } from 'react-router-dom';
import CssBaseline from '@material-ui/core/CssBaseline';
import Typography from '@material-ui/core/Typography';
import Lobby from './views/Lobby';
import Screen from './views/Screen';
import Controller from './views/Controller';

const NotFound = (props) => (
  <Typography variant="h3" color="secondary" style={{margin: 'auto'}}>
    Not found
  </Typography>
);

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
        path="/"
        exact
        component={Lobby}
      />
      <Route
        path="/games/:gameID/players/:playerID"
        exact
        render={props => <Controller {...props} {...props.match.params} />}
      />
      <Route
        path="/games/:gameID/:categoryID?/:playlistID?"
        exact
        render={props => <Screen {...props} {...props.match.params} />}
      />
      <Route
        path="/*"
        component={NotFound}
      />
    </Switch>
  </BrowserRouter>
);

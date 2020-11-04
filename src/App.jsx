import React from 'react';
import { BrowserRouter, Switch, Route } from 'react-router-dom';
import CssBaseline from '@material-ui/core/CssBaseline';
import Typography from '@material-ui/core/Typography';

import Lobby from './views/Lobby';
import Screen from './views/Screen';
import Controller from './views/Controller';
import useNoSleep from './hooks/useNoSleep';

const NotFound = ({ style, ...props }) => (
  <Typography variant="h3" color="secondary" style={{ margin: 'auto', ...style }} {...props}>
    Not found
  </Typography>
);

export default () => {
  // prevent screen from sleeping
  useNoSleep();

  return (
    <BrowserRouter>
      <CssBaseline />
      <Switch>
        <Route
          path="/"
          exact
          component={Lobby}
        />
        <Route
          path="/games/:gameID/players/:playerID"
          exact
          component={Controller}
        />
        <Route
          path="/games/:gameID/:categoryID?/:playlistID?"
          exact
          component={Screen}
        />
        <Route
          path="/*"
          component={NotFound}
        />
      </Switch>
    </BrowserRouter>
  );
}

import React from 'react';
import ReactDOM from 'react-dom';
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import App from './App';

const theme = createMuiTheme({
  palette: {
    type: 'dark',
    primary: {
      main: '#1db954',
      contrastText: '#fff',
    },
    secondary: {
      main: '#ff00e6',
    },
  },
});

ReactDOM.render((
  <MuiThemeProvider theme={theme}>
    <App />
  </MuiThemeProvider>
), document.getElementById('root'));

import React from 'react';
import Fab from '@material-ui/core/Fab';
import { makeStyles } from '@material-ui/core/styles';

import TileButton from './TileButton';
import { CHOICES_STARTUP, CHOICES_TIMEOUT } from '../helpers/game';

const useStyles = makeStyles(theme => ({
  root: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  choice: {
    display: 'flex',
    alignItems: 'center',
    margin: theme.spacing(),

    '> *': {
      margin: theme.spacing(),
    },

    '&:nth-child(1)': {
      flexDirection: 'column',
      flexBasis: '100%',
      marginBottom: -theme.spacing(8),
    },
    '&:nth-child(2)': {
      alignItems: 'center',
    },
    '&:nth-child(3)': {
      flexDirection: 'row-reverse',
    },
    '&:nth-child(4)': {
      flexDirection: 'column-reverse',
      flexBasis: '100%',
      marginTop: -theme.spacing(8),
    },
  },
  '@keyframes focus': {
    from: {
      filter: 'blur(100px)',
    },
    to: {
      filter: 'blur(0px)',
    },
  },
  album: {
    animation: `$focus ${Math.round((CHOICES_TIMEOUT - CHOICES_STARTUP) / 1000)}s forwards`,
  },
}));

export default ({ choices, correctID, onPick = () => {}, ...props }) => {
  const classes = useStyles();

  return (
    <div className={classes.root} {...props}>
      {choices.map(choice =>
        <div key={choice.id} className={classes.choice}>
          <TileButton
            image={choice.album.image}
            className={classes.album}
            onClick={() => onPick(choice)}
          />
          <Fab
            variant="extended"
            color={correctID === choice.id ? 'primary' : null}
            onClick={() => onPick(choice)}
          >
            {choice.name}
          </Fab>
        </div>
      )}
    </div>
  );
};

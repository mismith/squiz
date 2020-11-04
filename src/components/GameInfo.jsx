import React from 'react';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(theme => ({
  root: {
    textAlign: 'center',
    padding: theme.spacing(0, 2),
    margin: 'auto',
  },
  name: {
    fontSize: 10,
  },
  value: {
    marginBottom: -theme.spacing(),
  },
}));

export default function GameInfo({ name, value, color = undefined }) {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <Typography variant="h4" color={color} className={classes.value}>
        {value || <>&nbsp;</>}
      </Typography>
      <Typography variant="overline" color="textSecondary" className={classes.name}>
        {name || <>&nbsp;</>}
      </Typography>
    </div>
  );
}

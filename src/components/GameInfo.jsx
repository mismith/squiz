import React from 'react';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(theme => ({
  root: {
    display: 'flex',
    alignItems: 'center',
    maxWidth: '100%',
    textAlign: 'right',
    margin: 'auto',
  },
  name: {
    maxWidth: 44,
    fontSize: 10,
    lineHeight: 1,
    marginRight: theme.spacing(2),
  },
  value: {
  },
}));

export default function GameInfo({ name, value, color = undefined }) {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <Typography variant="overline" color="textSecondary" className={classes.name}>
        {name || <>&nbsp;</>}
      </Typography>
      <Typography variant="h4" color={color} noWrap className={classes.value}>
        {value || <>&nbsp;</>}
      </Typography>
    </div>
  );
}

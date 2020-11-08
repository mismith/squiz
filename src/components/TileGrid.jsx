import React from 'react';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(theme => ({
  root: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    padding: theme.spacing(),
  },
}));

export default function TileGrid({ className, ...props }) {
  const classes = useStyles();
  return (
    <div className={`${classes.root} ${className || ''}`} {...props} />
  );
}

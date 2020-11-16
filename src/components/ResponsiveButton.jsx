import React from 'react';
import { useTheme, useMediaQuery } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';

export default function ResponsiveButton({
  mediaQuery = undefined,
  Icon = null,
  children = null,
  ...props
}) {
  const theme = useTheme();
  const isFull = useMediaQuery(mediaQuery || theme.breakpoints.up('sm'));

  if (isFull) {
    return (
      <Button {...props}>
        {Icon && <Icon style={{ marginRight: 8 }} />}
        {children}
      </Button>
    )
  }
  return (
    <IconButton {...props}>
      {Icon && <Icon />}
    </IconButton>
  );
}

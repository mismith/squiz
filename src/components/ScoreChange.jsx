import React from 'react';
import Typography from '@material-ui/core/Typography';
import Zoom from '@material-ui/core/Zoom';

export default function PlayerChange({ change, color = 'secondary', ...props }) {
  return (
    <Zoom in={Boolean(change)} {...props}>
      <Typography variant="h6" color={color}>
        <span style={{ margin: 4 }}>+</span>{change}
      </Typography>
    </Zoom>
  );
}

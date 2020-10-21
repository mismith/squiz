import React from 'react';
import CircularProgress from '@material-ui/core/CircularProgress';

export default ({ style, ...props }) => (
  <CircularProgress style={{ margin: 'auto', ...style }} {...props} />
);

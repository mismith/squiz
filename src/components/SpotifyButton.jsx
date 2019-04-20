import React from 'react';
import Fab from '@material-ui/core/Fab';

export default ({ icon, children, style, ...props }) => (
  <Fab
    variant="extended"
    color="primary"
    style={{...style, minWidth: 200, fontWeight: 'bold', letterSpacing: '0.1429em'}}
    {...props}
  >
    {icon &&
      <span style={{display: 'inline-flex', marginRight: 16, alignItems: 'center'}}>{icon}</span>
    }
    {children}
  </Fab>
);

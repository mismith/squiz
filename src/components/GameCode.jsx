import React from 'react';
import Typography from '@material-ui/core/Typography';

const styles = {
  label: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    fontWeight: 'bold',
  },
};

export default ({ gameID }) => (
  <div style={{textAlign: 'center', margin: 'auto'}}>
    <Typography variant="h4">{gameID}</Typography>
    <Typography color="textSecondary" style={styles.label}>Game Code</Typography>
  </div>
);

import React from 'react';
import Typography from '@material-ui/core/Typography';

const styles = {
  label: {
    fontSize: 10,
    lineHeight: 1.5,
  },
};

export default ({ gameID }) => (
  <div style={{textAlign: 'center', margin: 'auto'}}>
    <Typography variant="h4">{gameID}</Typography>
    <Typography variant="overline" color="textSecondary" style={styles.label}>Game Code</Typography>
  </div>
);

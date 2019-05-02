import React from 'react';
import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';

const styles = {
  button: {
    minWidth: 200,
    fontWeight: 'bold',
    letterSpacing: '0.1429em',
    borderRadius: 32,
  },
  icon: {
    display: 'inline-flex',
    marginRight: 16,
    alignItems: 'center',
  },
  loader: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -12,
    marginLeft: -12,
  },
};

export default ({ icon, loading, children, style, ...props }) => (
  <Button
    variant="contained"
    color="primary"
    size="large"
    style={{...styles.button, ...style}}
    {...props}
  >
    <span style={{display: 'flex', visibility: loading ? 'hidden' : undefined}}>
      {icon &&
        <span style={styles.icon}>{icon}</span>
      }
      {children}
    </span>

    {loading &&
      <CircularProgress color="inherit" size={24} style={styles.loader} />
    }
  </Button>
);

import React from 'react';
import ButtonBase from '@material-ui/core/ButtonBase';

const styles = {
  button: {
    display: 'inline-flex',
    flexDirection: 'column',
    margin: 8,
  },
  label: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    color: '#fff',
    fontSize: 16,
    paddingTop: '50%',
  },
  img: {
    width: '100%',
  },
};

export default ({ label, image, size = 200, style, children, ...props }) => (
  <ButtonBase
    style={{ ...styles.button, ...style, width: size, height: size }}
    {...props}
  >
    {image &&
      <img src={image} alt="" style={styles.img} />
    }
    {label &&
      <div style={styles.label}>{label}</div>
    }
    {children}
  </ButtonBase>
);

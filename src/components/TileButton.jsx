import React from 'react';
import ButtonBase from '@material-ui/core/ButtonBase';

const styles = {
  button: {
    display: 'inline-flex',
    flexDirection: 'column',
    width: 200,
    height: 200,
    margin: 8,
  },
  title: {
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

export default ({ title, image, style, children, ...props }) => (
  <ButtonBase
    style={{ ...styles.button, ...style }}
    {...props}
  >
    {image &&
      <img src={image} alt="" style={styles.img} />
    }
    {title &&
      <div style={styles.title}>{title}</div>
    }
    {children}
  </ButtonBase>
);
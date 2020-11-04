import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import ButtonBase from '@material-ui/core/ButtonBase';
import { useAsync } from 'react-async-hook';

const useStyles = makeStyles({
  button: {
    display: 'inline-flex',
    flexDirection: 'column',
    margin: 8,
    transform: 'scale(1)',
    transition: 'transform 300ms',

    '&:hover': {
      transform: 'scale(1.05)',
    },
    '&:not(.imageLoaded)': {
      transform: `scale(0)`,
    },
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
  image: {
    width: '100%',
  },
});

const imgCache = {};
async function loadImage(src, force = false) {
  if (!src) return true;
  if (!imgCache[src] || force) {
    const img = document.createElement('img');
    imgCache[src] = new Promise(resolve => {
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = src;
    });
  }
  return imgCache[src];
}

export default React.forwardRef(({
  label,
  image,
  size = 200,
  className,
  style,
  children,
  ...props
}, ref) => {
  const classes = useStyles();
  const { result: isImageLoaded } = useAsync(loadImage, [image, true]);

  return (
    <ButtonBase
      className={`${className} ${classes.button} ${isImageLoaded ? 'imageLoaded' : ''}`}
      style={{ ...style, width: size, height: size }}
      {...props}
      ref={ref}
    >
      {image &&
        <img src={image} alt={label || ''} className={classes.image} />
      }
      {label &&
        <div className={classes.label}>{label}</div>
      }
      {children}
    </ButtonBase>
  );
});

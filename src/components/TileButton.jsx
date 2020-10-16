import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import ButtonBase from '@material-ui/core/ButtonBase';

const useStyles = makeStyles({
  button: {
    display: 'inline-flex',
    flexDirection: 'column',
    margin: 8,
    transition: 'transform 300ms',

    '&:hover': {
      transform: 'scale(1.05)',
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

export default React.forwardRef(({ label, image, size = 200, style, children, ...props }, ref) => {
  const classes = useStyles();

  return (
    <ButtonBase
      className={classes.button}
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

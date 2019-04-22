import React, { useState, useEffect } from 'react';
import { useSwipeable } from 'react-swipeable';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import KeyboardArrowUp from '@material-ui/icons/KeyboardArrowUp';
import KeyboardArrowLeft from '@material-ui/icons/KeyboardArrowLeft';
import KeyboardArrowRight from '@material-ui/icons/KeyboardArrowRight';
import KeyboardArrowDown from '@material-ui/icons/KeyboardArrowDown';

import SpotifyButton from '../components/SpotifyButton';
import TileButton from '../components/TileButton';

export default (props) => {
  const [swipe, setSwipe] = useState(null);
  const directions = [
    { dir: 'Up', icon: KeyboardArrowUp },
    { dir: 'Left', icon: KeyboardArrowLeft },
    { dir: 'Right', icon: KeyboardArrowRight },
    { dir: 'Down', icon: KeyboardArrowDown },
  ];

  const handlers = useSwipeable({
    onSwiped({ dir }) {
      setSwipe(dir);
      console.log(dir);
    },
    preventDefaultTouchmoveEvent: true,
    trackMouse: true, // @DEBUG
  });
  useEffect(() => {
    // prevent zooming on mobile: https://stackoverflow.com/a/39711930/888928
    document.addEventListener('gesturestart', e => e.preventDefault());
  }, []);

  const styles = {
    controller: {
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
    },
    directions: {
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: 'center',
      position: 'relative',
      maxWidth: '100vh',
      fontSize: 96,
      margin: 'auto 0',
    },
    direction: {
      display: 'flex',
      justifyContent: 'center',
      flexBasis: '50%',
    },
    label: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 16,
      opacity: 0.25,
      pointerEvents: 'none',
    }
  };

  return (
    <div style={styles.controller} {...handlers}>
      <AppBar>
        <Toolbar style={{justifyContent: 'center'}}>
        </Toolbar>
      </AppBar>

      <Typography component="div" color="textSecondary" style={styles.directions}>
        {directions.map(({ dir, icon: DirIcon}) =>
          <div key={dir} style={{...styles.direction, margin: (dir === 'Up' || dir === 'Down') && 'calc(25% - 96px) 10px'}}>
            <DirIcon color={swipe === dir ? 'primary' : 'inherit'} style={{fontSize: 'inherit'}} />
          </div>
        )}
        <label style={styles.label}>Swipe</label>
      </Typography>
    </div>
  );
};

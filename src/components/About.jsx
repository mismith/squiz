import React, { useEffect, useState } from 'react';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';

import Device from './Device';
import SpotifyButton from './SpotifyButton';
import ScoreChange from './ScoreChange';
import { directions } from '../helpers/directions';

const useStyles = makeStyles(theme => ({
  root: {},
  figure: {
    width: '100%',
    maxWidth: 600,
    textAlign: 'center',
    backgroundColor: theme.palette.primary.main,
    borderRadius: theme.spacing(3),
    padding: theme.spacing(4, 0),
    margin: theme.spacing(4, 0),
  },
  devices: {
    display: 'flex',
    justifyContent: 'space-around',
    padding: theme.spacing(0, 2),
  },
  directions: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    height: '100%',
  },
  direction: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '50%',
    height: '25%',
    pointerEvents: 'none',
    '&:first-child': {
      margin: 'auto 25% -10%',
    },
    '&:last-child': {
      margin: '-10% 25% auto',
    },
    '& svg': {
      width: '100%',
    },

    '&::after': {
      content: '""',
      position: 'absolute',
      top: '50%',
      left: '50%',
      width: 0,
      height: 0,
      borderRadius: '50%',
    },
    '&.active::after': {
      animation: '$highlight 1s',
    },
  },
  '@keyframes highlight': {
    from: {
      boxShadow: `0 0 ${theme.spacing(2)}px ${theme.spacing(2)}px white`,
    }
  },
  instructions: {
    '& strong': {
      color: theme.palette.primary.main,
    },
  },
}));

function getDir(index = Math.floor(Math.random() * directions.length)) {
  return directions[index]?.dir;
}
function Directions({ Component = undefined, active = undefined, ...props }) {
  const classes = useStyles();

  return (
    <Typography component="div" className={classes.directions} {...props}>
      {directions.map(({ dir, icon: Icon }) => {
        const Direction = Component || Icon;
        const isActive = active === dir;
        return (
          <div
            key={dir}
            className={`${classes.direction} ${isActive || active === true ? 'active' : ''}`}
          >
            <Direction color={isActive ? 'primary' : undefined} />
          </div>
        );
      })}
    </Typography>
  );
}

function Choice(props) {
  return (
    <SpotifyButton style={{ minWidth: 0, fontSize: 'inherit', padding: '1em 4em' }} {...props} />
  );
}
function Player({ variant, orientation, activeDir, index, ...props }) {
  const change = activeDir[0]?.[1] && activeDir[0]?.[0] === activeDir[index]?.[0]
    ? Math.round((activeDir[0]?.[1] - activeDir[index]?.[1]) / 7000 * 100)
    : 0;
  return (
    <Grid container direction="column" alignItems="center" {...props}>
      <ScoreChange change={change} />
      <Device variant={variant} orientation={orientation}>
        <Directions active={activeDir[index]?.[0]} />
      </Device>
    </Grid>
  );
}

function useRandomActions() {
  const [activeDir, setActiveDir] = useState([]);
  const [timeouts, setTimeouts] = useState([]);
  const [resets, setResets] = useState(false);
  let cancelled = false;
  const stop = () => timeouts.forEach(t => window.clearTimeout(t));
  const reset = () => {
    if (cancelled) return;
    stop();

    setActiveDir(v => { v[0] = [true, false]; return [...v]; });
    setTimeouts([
      window.setTimeout(() => {
        if (cancelled) return;
        setActiveDir(v => { v[0] = undefined; return [...v]; });
      }, 1 * 1000),
      window.setTimeout(() => {
        if (cancelled) return;
        setActiveDir(v => { v[0] = [getDir(), Date.now()]; return [...v]; });
      }, 7 * 1000),
      ...Array.apply(null, { length: 6 }).map((v, i) => window.setTimeout(() => {
        if (cancelled) return;
        setActiveDir(v => { v[i + 1] = [getDir(), Date.now()]; return [...v]; });
      }, 1 * 1000 + Math.floor(Math.random() * 6 * 1000))),
      window.setTimeout(() => {
        if (cancelled) return;
        reset();
        setActiveDir([]);
        setResets(v => !v);
      }, 10 * 1000),
    ]);
  };
  useEffect(() => {
    reset();
    return () => {
      cancelled = true;
      stop();
    }
  }, [resets]);

  return activeDir;
}

export default function About() {
  const classes = useStyles();
  const activeDir = useRandomActions();

  return (
    <>
      <Typography variant="h4">How To Play</Typography>

      <figure className={classes.figure}>
        <div style={{ position: 'relative', height: 250 }}>
          <Device variant="tv" style={{ position: 'absolute', left: '50%', bottom: 80, marginLeft: -300 / 2 }}>
            <Directions active={activeDir[0]?.[0]} Component={Choice} style={{ fontSize: 8 }} />
          </Device>
          <Device variant="laptop" style={{ position: 'absolute', left: '75%', bottom: 65, marginLeft: -145 / 2 }}>
            <Directions active={activeDir[0]?.[0]} Component={Choice} style={{ fontSize: 4 }} />
          </Device>
        </div>

        <div className={classes.devices}>
          <Player variant="tablet" activeDir={activeDir} index={1} style={{ marginTop: -60 }} />
          <Player variant="phone" activeDir={activeDir} index={2} style={{ alignSelf: 'center' }} />
          <Player variant="phone" activeDir={activeDir} index={3} style={{ alignSelf: 'flex-start' }} />
          <Player variant="phone" orientation="landscape" activeDir={activeDir} index={4} style={{ alignSelf: 'flex-end' }} />
          <Player variant="tablet" orientation="landscape" activeDir={activeDir} index={5} style={{ marginTop: -20, marginBottom: 20 }} />
          <Player variant="phone" activeDir={activeDir} index={6} style={{ marginTop: -40 }} />
        </div>
      </figure>
      <Typography variant="h6" className={classes.instructions}>
        <ol>
          <li><strong>Host a game</strong> on a screen that all players can see and hear.</li>
          <li>Have everyone <strong>join the game</strong> on their own device.</li>
          <li>Pick a category to start playing, then <strong>swipe in</strong> when you know the song!</li>
        </ol>
      </Typography>
    </>
  );
}

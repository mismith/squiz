import React from 'react';
import { useCollectionData, useDocumentData } from 'react-firebase-hooks/firestore';
import { makeStyles } from '@material-ui/core/styles';

import {
  ROUNDS_LIMIT,
  TRACKS_LIMIT,
  useLatestDocument,
} from '../helpers/game';
import { useProgress } from '../helpers/audio';

const useStyles = makeStyles(theme => ({
  root: {
    display: 'flex',
    flexWrap: 'nowrap',
    height: 4,
    width: '100%',
  },
  cell: {
    display: 'flex',
    flexWrap: 'nowrap',
    flex: 'auto',
    backgroundColor: theme.palette.text.disabled,
    '&:not(:last-child)': {
      borderRight: 'solid 1px black',
    },
    '&.active': {
      backgroundColor: theme.palette.primary.main,
    },
  },
  step: {
    backgroundColor: theme.palette.primary.main,
  },
}));

function ProgressStep() {
  const classes = useStyles();
  const progress = useProgress();

  return (
    <div className={classes.step} style={{ width: `${progress}%` }} />
  );
}

export default function ProgressIndicator({ gameRef, ...props }) {
  const classes = useStyles();

  const roundsNum = Array.apply(null, { length: ROUNDS_LIMIT }).map((v, i) => i + 1);
  const tracksNum = Array.apply(null, { length: TRACKS_LIMIT }).map((v, i) => i + 1);
  const roundsRef = gameRef.collection('rounds');
  const { value: rounds } = useCollectionData(roundsRef);
  const { value: { ref: roundRef } = {} } = useLatestDocument(roundsRef);
  const { value: round } = useDocumentData(roundRef, null, 'id');
  const { value: tracks } = useCollectionData(roundRef?.collection('tracks'));

  return (
    <div className={classes.root} {...props}>
      {roundsNum.map(i => (
        <div
          key={i}
          className={`${classes.cell} ${i < rounds?.length || (i === rounds?.length && round?.completed) ? 'active' : ''}`}
        >
          {tracksNum.map(j => !round?.completed && i === rounds?.length && (
            <div
              key={j}
              className={`${classes.cell} ${j < tracks?.length ? 'active' : ''}`}
            >
              {j === tracks?.length && (
                <ProgressStep />
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

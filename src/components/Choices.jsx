import React from 'react';
import Fab from '@material-ui/core/Fab';

import TileButton from './TileButton';
import './Choices.css';

export default ({ choices, correctID, onPick = () => {}, ...props }) => {
  return (
    <div className={`Choices ${correctID ? 'showCorrect' : ''}`} {...props}>
      {choices.map(choice =>
        <div key={choice.id}>
          <TileButton
            image={choice.album.image}
            onClick={() => onPick(choice)}
          />
          <Fab
            variant="extended"
            color={correctID === choice.id ? 'primary' : null}
            onClick={() => onPick(choice)}
          >
            {choice.name}
          </Fab>
        </div>
      )}
    </div>
  );
};

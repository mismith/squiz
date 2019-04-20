import React from 'react';
import Fab from '@material-ui/core/Fab';

import TileButton from './TileButton';
import './Choices.css';

export default ({ choices, showCorrect, onPick, ...props }) => (
  <div className={`Choices ${showCorrect ? 'showCorrect' : ''}`} {...props}>
    {choices.map(choice =>
      <div key={choice.id}>
        <TileButton
          image={choice.album.images[0].url}
          onClick={() => onPick(choice)}
        />
        <Fab
          variant="extended"
          color={showCorrect && choice.$isCorrect ? 'primary' : null}
          onClick={() => onPick(choice)}
        >
          {choice.name}
        </Fab>
      </div>
    )}
  </div>
);

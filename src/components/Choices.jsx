import React from 'react';
import Fab from '@material-ui/core/Fab';

import TileButton from './TileButton';
import './Choices.css';

const prev = {};
export default React.memo(({ choices, correctID, onPick = () => {}, ...props }) => {
  console.log(prev.choices === choices);
  prev.choices = choices;
  console.log('Choices', Date.now());
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
}, (prevProps, nextProps) => {
  console.log(prevProps, nextProps);
  return false;
});

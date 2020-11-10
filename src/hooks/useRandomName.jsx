import { useState } from 'react';
import { useAsync } from 'react-async-hook';


export default function useRandomName() {
  const [remainingRandomNames, setRemainingRandomNames] = useState([]);
  useAsync(async () => {
    if (!remainingRandomNames.length) {
      const url = 'http://names.drycodes.com/25?nameOptions=funnyWords';
      const names = await (await fetch(`https://cors-anywhere.herokuapp.com/${url}`)).json();
      setRemainingRandomNames(names);
    }
  }, [remainingRandomNames.length]);

  const getRandomName = () => {
    const nextRandomName = remainingRandomNames.splice(0, 1);
    setRemainingRandomNames(remainingRandomNames);
    return nextRandomName;
  };

  getRandomName.remaining = remainingRandomNames;

  return getRandomName;
}

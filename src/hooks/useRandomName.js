import { useState } from 'react';
import useAsyncEffect from 'use-async-effect';

export default function useRandomName() {
  const [randomNamesRemaining, setRandomNamesRemaining] = useState([]);
  useAsyncEffect(async (isMounted) => {
    if (!randomNamesRemaining.length) {
      const url = 'http://names.drycodes.com/25?nameOptions=funnyWords';
      const names = await (await fetch(`https://cors-anywhere.herokuapp.com/${url}`)).json();
      if (!isMounted()) return;
      setRandomNamesRemaining(names);
    }
  }, [randomNamesRemaining.length]);

  const getRandomName = () => {
    const nextRandomName = randomNamesRemaining.splice(0, 1);
    setRandomNamesRemaining(randomNamesRemaining);
    return nextRandomName;
  };

  return [getRandomName, randomNamesRemaining];
}

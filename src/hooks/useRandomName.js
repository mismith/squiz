import { useState } from 'react';
import useAsyncEffect from 'use-async-effect';


export default function useRandomName() {
  const [remainingRandomNames, setRemainingRandomNames] = useState([]);
  useAsyncEffect(async (isMounted) => {
    if (!remainingRandomNames.length) {
      const url = 'http://names.drycodes.com/25?nameOptions=funnyWords';
      const names = await (await fetch(`https://cors-anywhere.herokuapp.com/${url}`)).json();
      if (!isMounted()) {
        setRemainingRandomNames(names);
      }
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

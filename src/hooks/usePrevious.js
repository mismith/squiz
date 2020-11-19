import { useEffect, useRef } from 'react';

export default function usePrevious(value) {
  const ref = useRef();
  const setPrevious = (value) => {
    ref.current = value;
  };
  useEffect(() => {
    if (ref.current !== value) {
      setPrevious(value);
    }
  });
  return [ref.current, setPrevious];
}

import { useState, useEffect } from 'react';

export const usePromised = (fn, dependencies = undefined, intialValue = undefined) => {
  const [value, setValue] = useState(intialValue);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let didCancel = false;
    const awaiter = async () => {
      setError(null);
      setLoading(true);

      try {
        const v = await fn();
        if (!didCancel) {
          setValue(v);
        }
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    awaiter();

    return () => {
      didCancel = true;
    };
  }, dependencies);

  return [
    value,
    loading,
    error,
  ];
};

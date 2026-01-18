import { useEffect, useState } from 'react';

import { getAssetUriAsync } from '@/lib/media';

export const useAssetUri = (assetId: string | null) => {
  const [uri, setUri] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (!assetId) {
      setUri(null);
      return;
    }
    getAssetUriAsync(assetId)
      .then((assetUri) => {
        if (isMounted) {
          setUri(assetUri);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err as Error);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [assetId]);

  return { uri, error };
};

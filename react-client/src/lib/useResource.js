'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * @template T
 * @typedef {object} ResourceState
 * @property {'loading' | 'success' | 'error'} status
 * @property {T | null} data
 * @property {Error | null} error
 * @property {boolean} loading
 * @property {() => void} reload
 */

/**
 * Loads data from the api layer and exposes loading / error / success states.
 *
 * @template T
 * @param {(param?: string) => Promise<T>} fetcher
 * @param {string} [param] Single primitive argument, kept primitive so the
 *   effect dependency stays stable across renders.
 * @returns {ResourceState<T>}
 */
export default function useResource(fetcher, param) {
  const [state, setState] = useState(
    /** @type {{ status: 'loading' | 'success' | 'error', data: T | null, error: Error | null, requestKey: string }} */({
      status: 'loading',
      data: null,
      error: null,
      requestKey: '',
    }),
  );
  const [reloadToken, setReloadToken] = useState(0);
  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  const requestKey = `${param ?? ''}:${reloadToken}`;

  // Reset to loading during render when the request key changes, rather than
  // inside the effect, so there is no synchronous setState-in-effect pattern.
  const resetState =
    state.requestKey !== requestKey
      ? { status: /** @type {const} */ ('loading'), data: null, error: null, requestKey }
      : state;

  if (resetState !== state) setState(resetState);

  useEffect(() => {
    let isCurrent = true;

    Promise.resolve(fetcher(param))
      .then((data) => {
        if (isCurrent) setState({ status: 'success', data, error: null, requestKey });
      })
      .catch((error) => {
        if (isCurrent) {
          setState({
            status: 'error',
            data: null,
            error: error instanceof Error ? error : new Error(String(error)),
            requestKey,
          });
        }
      });

    return () => {
      isCurrent = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey]);

  return { ...resetState, loading: resetState.status === 'loading', reload };
}

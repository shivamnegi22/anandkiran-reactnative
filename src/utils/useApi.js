import { useCallback, useEffect, useRef, useState } from 'react';
import { UnavailableError } from '../api/patient';

/**
 * Loads data for a screen. status: 'loading' | 'ready' | 'error' | 'unavailable'.
 * `refresh()` reloads (used by pull-to-refresh) without blanking the screen.
 */
export default function useApi(loader, deps = []) {
  const [state, setState] = useState({ status: 'loading', data: null, refreshing: false });
  const mounted = useRef(true);
  useEffect(() => () => { mounted.current = false; }, []);

  const run = useCallback(async (isRefresh = false) => {
    setState((prev) => ({ ...prev, status: isRefresh && prev.data ? prev.status : 'loading', refreshing: isRefresh }));
    try {
      const data = await loader();
      if (mounted.current) setState({ status: 'ready', data, refreshing: false });
    } catch (error) {
      if (!mounted.current) return;
      setState((prev) => ({
        status: error instanceof UnavailableError ? 'unavailable' : 'error',
        data: prev.data,
        refreshing: false,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    run(false);
  }, [run]);

  return { ...state, reload: () => run(false), refresh: () => run(true), setData: (data) => setState((prev) => ({ ...prev, data })) };
}

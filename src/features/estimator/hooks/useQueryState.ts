import { useEffect } from "react";

export function useQueryState<T>(key: string, state: T, setState: (v: T) => void) {
  // load on mount
  useEffect(() => {
    const url = new URL(window.location.href);
    const raw = url.searchParams.get(key);
    if (raw) {
      try { setState(JSON.parse(atob(decodeURIComponent(raw))) as T); } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // persist on change
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set(key, encodeURIComponent(btoa(JSON.stringify(state))));
      window.history.replaceState({}, "", url.toString());
    } catch {}
  }, [key, state]);
}

import { useEffect, useState } from 'react';

export interface FuelReading {
  fuelPercent: number;
  updatedAt: string;
}

const POLL_INTERVAL_MS = 45 * 1000;

/**
 * Live fuel-percent-by-tracto-Clave map, proxied through server/ (Samsara
 * blocks CORS and forbids client-side tokens, so this can't call Samsara
 * directly from the browser). Ephemeral UI state, not user-edited data.
 */
export function useFuelByClave(): Record<string, FuelReading> {
  const [data, setData] = useState<Record<string, FuelReading>>({});

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch('/api/fuel');
        if (!res.ok) return;
        const body = await res.json();
        if (!cancelled) setData(body);
      } catch {
        // Server proxy unreachable — keep showing the last known values.
      }
    }

    poll();
    const id = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return data;
}

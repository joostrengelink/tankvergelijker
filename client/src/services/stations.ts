import type { Station } from '../types';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

export async function fetchStations(lat: number, lon: number, radiusKm = 10): Promise<Station[]> {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    radius: String(radiusKm),
  });

  const response = await fetch(`${API_BASE}/api/stations?${params}`);

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `Server error ${response.status}`);
  }

  return response.json() as Promise<Station[]>;
}

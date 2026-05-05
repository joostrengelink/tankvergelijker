import type { EVStation } from '../types/ev';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

export async function fetchEVStations(lat: number, lon: number, radiusKm = 10): Promise<EVStation[]> {
  const params = new URLSearchParams({ lat: String(lat), lon: String(lon), radius: String(radiusKm) });
  const response = await fetch(`${API_BASE}/api/ev-stations?${params}`);
  if (!response.ok) throw new Error(`Server error ${response.status}`);
  return response.json() as Promise<EVStation[]>;
}

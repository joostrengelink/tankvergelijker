import type { SearchLocation } from '../types';

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

export async function geocodeQuery(query: string): Promise<SearchLocation> {
  const params = new URLSearchParams({
    q: query,
    countrycodes: 'nl',
    format: 'jsonv2',
    limit: '1',
    addressdetails: '0',
  });

  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?${params}`,
    { headers: { 'Accept-Language': 'nl', 'User-Agent': 'GasPrijzenNL/1.0' } }
  );

  if (!response.ok) {
    throw new Error('Geocoding service unavailable');
  }

  const results: NominatimResult[] = await response.json();

  if (results.length === 0) {
    throw new Error(`Geen locatie gevonden voor "${query}"`);
  }

  const top = results[0];
  return {
    query,
    lat: parseFloat(top.lat),
    lon: parseFloat(top.lon),
    displayName: top.display_name.split(',').slice(0, 2).join(', '),
  };
}

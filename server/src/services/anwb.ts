import type { Station, FuelType } from '../../../shared/types';

const ANWB_API_BASE = 'https://api.anwb.nl/routing/points-of-interest/v3/all';

const FUEL_TYPE_MAP: Record<string, FuelType> = {
  EURO95: 'euro95',
  DIESEL: 'diesel',
  EURO98: 'superplus98',
  AUTOGAS: 'lpg',
};

const KNOWN_BRANDS = ['Shell', 'BP', 'Esso', 'Tango', 'Tinq', 'Tamoil', 'Q8',
  'Gulf', 'Total', 'Texaco', 'Calpam', 'OAD', 'Argos', 'Avia',
  'Firezone', 'Neste', 'Jet', 'Lukoil', 'Alfa', 'Trekpleister'];

interface AnwbPrice {
  fuelType: string;
  value: number;
}

interface AnwbStation {
  id: string;
  title: string;
  coordinates: { latitude: number; longitude: number };
  address: { streetAddress: string; postalCode: string; city: string };
  prices: AnwbPrice[];
  openingHours: Array<{ dayOfWeek: string[]; opens: string; closes: string }> | null;
}

function extractBrand(title: string): string {
  const upper = title.toUpperCase();
  for (const b of KNOWN_BRANDS) {
    if (upper.startsWith(b.toUpperCase())) return b;
  }
  return title.split(' ')[0];
}

function getTodayHours(openingHours: AnwbStation['openingHours']): string | null {
  if (!openingHours?.length) return null;
  const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  const today = days[new Date().getDay()];
  for (const slot of openingHours) {
    if (slot.dayOfWeek.includes(today)) {
      if (slot.opens === '00:00' && slot.closes === '24:00') return '24/7';
      return `${slot.opens} – ${slot.closes}`;
    }
  }
  return 'Gesloten';
}

export async function fetchStationsFromAnwb(lat: number, lon: number, radiusKm: number): Promise<Station[]> {
  const delta = radiusKm / 111;
  const lonDelta = delta / Math.cos((lat * Math.PI) / 180);
  const bbox = `${lat - delta},${lon - lonDelta},${lat + delta},${lon + lonDelta}`;

  const url = `${ANWB_API_BASE}?type-filter=FUEL_STATION&bounding-box-filter=${encodeURIComponent(bbox)}`;

  const response = await fetch(url, {
    headers: { Accept: 'application/json', 'Accept-Language': 'nl-NL' },
  });

  if (!response.ok) throw new Error(`ANWB API error: ${response.status}`);

  const data = await response.json() as { value?: AnwbStation[] };
  const stations = data.value ?? [];

  return stations.map((s): Station => {
    const prices: Partial<Record<FuelType, number>> = {};
    for (const p of s.prices ?? []) {
      const ft = FUEL_TYPE_MAP[p.fuelType];
      if (ft && p.value > 0) prices[ft] = p.value;
    }
    return {
      id: s.id,
      name: s.title,
      brand: extractBrand(s.title),
      address: s.address?.streetAddress ?? '',
      city: s.address?.city ?? '',
      lat: s.coordinates.latitude,
      lon: s.coordinates.longitude,
      prices,
      openingHours: getTodayHours(s.openingHours),
      lastUpdated: new Date().toISOString(),
    };
  });
}

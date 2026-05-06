/* eslint-disable @typescript-eslint/no-explicit-any */
const ANWB_BASE = 'https://api.anwb.nl/routing/points-of-interest/v3/all';

const FUEL_MAP: Record<string, string> = {
  EURO95: 'euro95',
  DIESEL: 'diesel',
  EURO98: 'superplus98',
  AUTOGAS: 'lpg',
};

const KNOWN_BRANDS = [
  'Shell', 'BP', 'Esso', 'Tango', 'Tinq', 'Tamoil', 'Q8', 'Gulf',
  'Total', 'Texaco', 'Calpam', 'OAD', 'Argos', 'Avia', 'Firezone',
  'Neste', 'Jet', 'Lukoil', 'Alfa',
];

function extractBrand(title: string): string {
  const upper = title.toUpperCase();
  for (const b of KNOWN_BRANDS) {
    if (upper.startsWith(b.toUpperCase())) return b;
  }
  return title.split(' ')[0];
}

function getTodayHours(slots: Array<{ dayOfWeek: string[]; opens: string; closes: string }> | null): string | null {
  if (!slots?.length) return null;
  const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  const today = days[new Date().getDay()];
  for (const s of slots) {
    if (s.dayOfWeek.includes(today)) {
      return s.opens === '00:00' && s.closes === '24:00' ? '24/7' : `${s.opens} – ${s.closes}`;
    }
  }
  return 'Gesloten';
}

export default async function handler(req: any, res: any) {
  const url = new URL(req.url ?? '', `http://localhost`);
  const lat = parseFloat(url.searchParams.get('lat') ?? '');
  const lon = parseFloat(url.searchParams.get('lon') ?? '');
  const radius = parseFloat(url.searchParams.get('radius') ?? '10');

  if (isNaN(lat) || isNaN(lon)) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'lat en lon zijn vereist' }));
    return;
  }

  const delta = radius / 111;
  const lonDelta = delta / Math.cos((lat * Math.PI) / 180);
  const bbox = `${lat - delta},${lon - lonDelta},${lat + delta},${lon + lonDelta}`;
  const apiUrl = `${ANWB_BASE}?type-filter=FUEL_STATION&bounding-box-filter=${encodeURIComponent(bbox)}`;

  try {
    const upstream = await fetch(apiUrl, {
      headers: { Accept: 'application/json', 'Accept-Language': 'nl-NL' },
    });

    if (!upstream.ok) throw new Error(`ANWB ${upstream.status}`);

    const data = await upstream.json() as { value?: Array<{
      id: string;
      title: string;
      coordinates: { latitude: number; longitude: number };
      address: { streetAddress: string; city: string };
      prices: Array<{ fuelType: string; value: number }>;
      openingHours: Array<{ dayOfWeek: string[]; opens: string; closes: string }> | null;
    }> };

    const stations = (data.value ?? []).map((s) => {
      const prices: Record<string, number> = {};
      for (const p of s.prices ?? []) {
        const ft = FUEL_MAP[p.fuelType];
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

    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Cache-Control': 's-maxage=900, stale-while-revalidate=1800',
    });
    res.end(JSON.stringify(stations));
  } catch (err) {
    console.error('ANWB error:', err);
    res.writeHead(503, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Kon stationsdata niet ophalen' }));
  }
}

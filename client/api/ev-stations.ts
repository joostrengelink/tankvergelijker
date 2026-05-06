/* eslint-disable @typescript-eslint/no-explicit-any */
const OVERPASS_MIRRORS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];

const SOCKET_LABELS: Record<string, string> = {
  type2: 'Type 2 (AC)',
  type2_combo: 'CCS (DC)',
  chademo: 'CHAdeMO (DC)',
  tesla_supercharger: 'Tesla SC',
  type1: 'Type 1 (AC)',
  type1_combo: 'CCS Type 1',
  schuko: 'Schuko',
};

const OPERATOR_PRICES: Record<string, { price: number; note: string }> = {
  'fastned':        { price: 0.77, note: 'Publiek tarief; €0.54 met Gold abonnement' },
  'allego':         { price: 0.59, note: 'Publiek DC snellaadtarief' },
  'shell':          { price: 0.63, note: 'Shell Recharge publiek tarief' },
  'shell recharge': { price: 0.63, note: 'Shell Recharge publiek tarief' },
  'vattenfall':     { price: 0.38, note: 'Vattenfall publiek AC-tarief' },
  'evbox':          { price: 0.42, note: 'EVBox varieert per locatie' },
  'eneco':          { price: 0.39, note: 'Eneco publiek tarief' },
  'bp pulse':       { price: 0.57, note: 'BP Pulse publiek tarief' },
  'totalenergies':  { price: 0.49, note: 'TotalEnergies publiek tarief' },
  'total':          { price: 0.49, note: 'TotalEnergies publiek tarief' },
  'ionity':         { price: 0.79, note: 'Publiek tarief; €0.35 met IONITY+ abonnement' },
  'tesla':          { price: 0.52, note: 'Tesla Supercharger niet-Tesla tarief' },
  'supercharger':   { price: 0.52, note: 'Tesla Supercharger niet-Tesla tarief' },
  'lidl':           { price: 0.25, note: 'Laag tarief bij Lidl' },
  'ikea':           { price: 0.25, note: 'Laag tarief bij IKEA' },
  'albert heijn':   { price: 0.34, note: 'AH laadpaal tarief' },
  'chargepoint':    { price: 0.45, note: 'ChargePoint publiek tarief' },
  'recharger':      { price: 0.37, note: 'ReCharger publiek tarief' },
  'e-flux':         { price: 0.39, note: 'E-flux publiek tarief' },
  'blue current':   { price: 0.40, note: 'Blue Current publiek tarief' },
  'equans':         { price: 0.31, note: 'Equans publiek AC-tarief' },
  'greenflux':      { price: 0.41, note: 'Greenflux publiek tarief' },
  'ecotap':         { price: 0.38, note: 'Ecotap publiek tarief' },
  'amsterdam':      { price: 0.31, note: 'Gemeente Amsterdam laadpaal tarief' },
  'pitpoint':       { price: 0.42, note: 'PitPoint publiek tarief' },
  'engie':          { price: 0.34, note: 'Engie publiek tarief' },
  'park n charge':  { price: 0.35, note: 'Park & Charge publiek tarief' },
};

function getOperatorPrice(operator: string): { price: number; note: string } | null {
  const key = operator.toLowerCase();
  for (const [k, v] of Object.entries(OPERATOR_PRICES)) {
    if (key.includes(k)) return v;
  }
  return null;
}

function parseKw(val: string | undefined): number | null {
  if (!val) return null;
  const m = val.match(/[\d.]+/);
  return m ? parseFloat(m[0]) : null;
}

function parseSocket(tags: Record<string, string>, key: string) {
  const raw = tags[`socket:${key}`];
  if (!raw || raw === 'no') return null;
  const count = parseInt(raw) || 1;
  const powerKw = parseKw(tags[`socket:${key}:output`]) ?? parseKw(tags[`socket:${key}:power`]) ?? null;
  return { type: key, label: SOCKET_LABELS[key] ?? key, count, powerKw };
}

async function overpassQuery(query: string): Promise<Response> {
  for (const mirror of OVERPASS_MIRRORS) {
    try {
      const res = await fetch(`${mirror}?data=${encodeURIComponent(query)}`, {
        headers: { 'User-Agent': 'TankVergelijker/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(12000),
      });
      if (res.ok) return res;
    } catch { /* try next mirror */ }
  }
  throw new Error('Alle Overpass mirrors onbereikbaar');
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
  const query = `[out:json][timeout:15];node["amenity"="charging_station"](${bbox});out body;`;

  try {
    const upstream = await overpassQuery(query);
    const data = await upstream.json() as {
      elements: Array<{ id: number; lat: number; lon: number; tags: Record<string, string> }>
    };

    const socketKeys = ['type2', 'type2_combo', 'chademo', 'tesla_supercharger', 'type1', 'type1_combo', 'schuko'];
    const stations = data.elements.map((el) => {
      const t = el.tags ?? {};
      const sockets = socketKeys.map((k) => parseSocket(t, k)).filter(Boolean) as Array<{ type: string; label: string; count: number; powerKw: number | null }>;
      const allPowers = sockets.map((s) => s.powerKw).filter((p): p is number => p !== null);
      const maxPowerKw = allPowers.length ? Math.max(...allPowers) :
        parseKw(t['maxpower:kw']) ?? parseKw(t['charging_station:output']) ?? parseKw(t['output']) ?? null;

      const rawOperator = t.operator ?? t.brand ?? t.network ?? 'Onbekend';
      const operator = rawOperator.replace(/B\.?V\.?/gi, '').replace(/Nederland/gi, '').replace(/Charging/gi, '').trim().replace(/\s+/g, ' ');
      const name = t.name ?? `${operator} laadpunt`;
      const pricing = getOperatorPrice(rawOperator);
      const osmPrice = t.fee === 'no' ? 0 : parseKw(t['charge']);

      return {
        id: `osm_${el.id}`,
        name,
        operator,
        lat: el.lat,
        lon: el.lon,
        address: t['addr:street'] ? `${t['addr:street']} ${t['addr:housenumber'] ?? ''}`.trim() : '',
        city: t['addr:city'] ?? t['addr:town'] ?? t['addr:place'] ?? '',
        capacity: parseInt(t.capacity) || sockets.reduce((s, x) => s + x.count, 0) || 1,
        maxPowerKw,
        sockets,
        isFastCharger: (maxPowerKw ?? 0) >= 50,
        pricePerKwh: osmPrice !== null ? osmPrice : pricing?.price ?? null,
        priceNote: t.fee === 'no' ? 'Gratis laden' : pricing?.note ?? null,
      };
    });

    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Cache-Control': 's-maxage=1200, stale-while-revalidate=2400',
    });
    res.end(JSON.stringify(stations));
  } catch (err) {
    console.error('Overpass error:', err);
    res.writeHead(503, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Kon laadpaaldata niet ophalen' }));
  }
}

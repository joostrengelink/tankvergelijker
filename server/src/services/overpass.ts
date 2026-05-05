export interface EVStation {
  id: string;
  name: string;
  operator: string;
  lat: number;
  lon: number;
  address: string;
  city: string;
  capacity: number;
  maxPowerKw: number | null;
  sockets: { type: string; label: string; count: number; powerKw: number | null }[];
  isFastCharger: boolean;
  pricePerKwh: number | null;
  priceNote: string | null;
  distanceKm?: number;
}

const SOCKET_LABELS: Record<string, string> = {
  type2: 'Type 2 (AC)',
  type2_combo: 'CCS (DC)',
  chademo: 'CHAdeMO (DC)',
  tesla_supercharger: 'Tesla SC',
  type1: 'Type 1 (AC)',
  type1_combo: 'CCS Type 1',
  schuko: 'Schuko',
};

// Indicatieve publieke tarieven per kWh voor grote NL laadnetwerken (mei 2025)
const OPERATOR_PRICES: Record<string, { price: number; note: string }> = {
  'fastned':        { price: 0.77, note: 'Publiek tarief; €0.54 met Gold abonnement' },
  'allego':         { price: 0.59, note: 'Publiek DC snellaadtarief; AC-palen varieert' },
  'shell':          { price: 0.63, note: 'Shell Recharge publiek tarief' },
  'shell recharge': { price: 0.63, note: 'Shell Recharge publiek tarief' },
  'vattenfall':     { price: 0.38, note: 'Vattenfall publiek AC-tarief' },
  'nuon':           { price: 0.38, note: 'Vattenfall/NUON publiek tarief' },
  'evbox':          { price: 0.42, note: 'EVBox varieert per locatie/beheerder' },
  'eneco':          { price: 0.39, note: 'Eneco publiek tarief' },
  'greenlots':      { price: 0.42, note: 'Indicatief tarief' },
  'bp pulse':       { price: 0.57, note: 'BP Pulse publiek tarief' },
  'totalenergies':  { price: 0.49, note: 'TotalEnergies publiek tarief' },
  'total':          { price: 0.49, note: 'TotalEnergies publiek tarief' },
  'ionity':         { price: 0.79, note: 'Publiek tarief; €0.35 met IONITY+ abonnement' },
  'tesla':          { price: 0.52, note: 'Tesla Supercharger niet-Tesla tarief' },
  'supercharger':   { price: 0.52, note: 'Tesla Supercharger niet-Tesla tarief' },
  'lidl':           { price: 0.25, note: 'Laag tarief bij Lidl' },
  'ikea':           { price: 0.25, note: 'Laag tarief bij IKEA' },
  'albert heijn':   { price: 0.34, note: 'AH laadpaal tarief' },
  'ah':             { price: 0.34, note: 'AH laadpaal tarief' },
  'chargepoint':    { price: 0.45, note: 'ChargePoint publiek tarief' },
  'recharger':      { price: 0.37, note: 'ReCharger (Amsterdam) publiek tarief' },
  'nuon recharger': { price: 0.37, note: 'ReCharger publiek tarief' },
  'e-flux':         { price: 0.39, note: 'E-flux publiek tarief' },
  'eflux':          { price: 0.39, note: 'E-flux publiek tarief' },
  'blue current':   { price: 0.40, note: 'Blue Current publiek tarief' },
  'bluecurrent':    { price: 0.40, note: 'Blue Current publiek tarief' },
};

function normalizeOperator(raw: string): string {
  return raw
    .replace(/B\.?V\.?/gi, '').replace(/Nederland/gi, '')
    .replace(/Charging/gi, '').replace(/Electric/gi, '')
    .trim().replace(/\s+/g, ' ');
}

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

function parseSocket(tags: Record<string, string>, key: string): { type: string; label: string; count: number; powerKw: number | null } | null {
  const raw = tags[`socket:${key}`];
  if (!raw || raw === 'no') return null;
  const count = parseInt(raw) || 1;
  const powerKw =
    parseKw(tags[`socket:${key}:output`]) ??
    parseKw(tags[`socket:${key}:power`]) ??
    null;
  return { type: key, label: SOCKET_LABELS[key] ?? key, count, powerKw };
}

const OVERPASS_MIRRORS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];

async function overpassQuery(query: string): Promise<Response> {
  for (const mirror of OVERPASS_MIRRORS) {
    try {
      const res = await fetch(`${mirror}?data=${encodeURIComponent(query)}`, {
        headers: {
          'User-Agent': 'TankVergelijker/1.0',
          'Accept': 'application/json',
        },
      });
      if (res.ok) return res;
    } catch { /* try next */ }
  }
  throw new Error('Alle Overpass mirrors onbereikbaar');
}

export async function fetchEVStations(lat: number, lon: number, radiusKm: number): Promise<EVStation[]> {
  const delta = radiusKm / 111;
  const lonDelta = delta / Math.cos((lat * Math.PI) / 180);
  const bbox = `${lat - delta},${lon - lonDelta},${lat + delta},${lon + lonDelta}`;
  const query = `[out:json][timeout:15];node["amenity"="charging_station"](${bbox});out body;`;

  const response = await overpassQuery(query);
  if (!response.ok) throw new Error(`Overpass error: ${response.status}`);

  const data = await response.json() as {
    elements: Array<{ id: number; lat: number; lon: number; tags: Record<string, string> }>
  };

  return data.elements.map((el): EVStation => {
    const t = el.tags ?? {};
    const socketKeys = ['type2', 'type2_combo', 'chademo', 'tesla_supercharger', 'type1', 'type1_combo', 'schuko'];
    const sockets = socketKeys.map((k) => parseSocket(t, k)).filter(Boolean) as EVStation['sockets'];

    const allPowers = sockets.map((s) => s.powerKw).filter((p): p is number => p !== null);
    const maxPowerKw =
      allPowers.length ? Math.max(...allPowers) :
      parseKw(t['maxpower:kw']) ??
      parseKw(t['charging_station:output']) ??
      parseKw(t['output']) ?? null;

    const rawOperator = t.operator ?? t.brand ?? t.network ?? 'Onbekend';
    const operator = normalizeOperator(rawOperator);
    const name = t.name ?? `${operator} laadpunt`;

    const pricing = getOperatorPrice(rawOperator);
    const osmPrice = parseKw(t['fee'] === 'no' ? '0' : t['charge']);

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
}

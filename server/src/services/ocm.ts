import type { EVStation } from './overpass';

const OCM_BASE = 'https://api.openchargemap.io/v3/poi/';

const SOCKET_LABELS: Record<string, string> = {
  type2: 'Type 2 (AC)',
  type2_combo: 'CCS (DC)',
  chademo: 'CHAdeMO (DC)',
  tesla_supercharger: 'Tesla SC',
  type1: 'Type 1 (AC)',
  type1_combo: 'CCS Type 1',
  schuko: 'Schuko',
};

interface OCMConnectionType {
  FormalName?: string;
  Title?: string;
}

interface OCMConnection {
  ConnectionType?: OCMConnectionType;
  Quantity?: number;
  PowerKW?: number;
}

interface OCMStation {
  ID: number;
  AddressInfo: {
    Title: string;
    AddressLine1?: string;
    Town?: string;
    Latitude: number;
    Longitude: number;
    Distance?: number;
  };
  OperatorInfo?: { Title: string };
  Connections?: OCMConnection[];
  UsageCost?: string | null;
  NumberOfPoints?: number;
}

function mapConnectionType(ct: OCMConnectionType): string {
  const n = (ct.FormalName ?? ct.Title ?? '').toLowerCase();
  if (n.includes('ccs') && n.includes('combo 2')) return 'type2_combo';
  if (n.includes('ccs') && n.includes('combo 1')) return 'type1_combo';
  if (n.includes('chademo')) return 'chademo';
  if (n.includes('type 2') || n.includes('mennekes')) return 'type2';
  if (n.includes('type 1') || n.includes('j1772')) return 'type1';
  if (n.includes('tesla') || n.includes('nacs')) return 'tesla_supercharger';
  if (n.includes('schuko')) return 'schuko';
  return '';
}

function parseUsageCost(cost: string | null | undefined): { price: number | null; note: string | null } {
  if (!cost) return { price: null, note: null };
  const note = cost.trim();
  if (/gratis|free|kosteloos/i.test(note)) return { price: 0, note };
  const m = note.match(/[€$]?\s*([\d.,]+)\s*(?:per\s*)?kWh/i);
  if (m) {
    const price = parseFloat(m[1].replace(',', '.'));
    return { price: isNaN(price) ? null : price, note };
  }
  return { price: null, note };
}

export async function fetchEVStationsFromOCM(lat: number, lon: number, radiusKm: number): Promise<EVStation[]> {
  const apiKey = process.env.OCM_API_KEY;
  if (!apiKey) throw new Error('OCM_API_KEY not configured');

  const url = new URL(OCM_BASE);
  url.searchParams.set('output', 'json');
  url.searchParams.set('countrycode', 'NL');
  url.searchParams.set('latitude', String(lat));
  url.searchParams.set('longitude', String(lon));
  url.searchParams.set('distance', String(radiusKm));
  url.searchParams.set('distanceunit', 'KM');
  url.searchParams.set('maxresults', '100');
  url.searchParams.set('compact', 'false');
  url.searchParams.set('verbose', 'false');
  url.searchParams.set('key', apiKey);

  const res = await fetch(url.toString(), {
    headers: { 'User-Agent': 'TankVergelijker/1.0', Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`OCM API ${res.status}`);

  const data = await res.json() as OCMStation[];

  return data.map((s): EVStation => {
    const conns = (s.Connections ?? []).filter((c) => c.ConnectionType);
    const sockets = conns
      .map((c) => {
        const type = mapConnectionType(c.ConnectionType!);
        if (!type) return null;
        return { type, label: SOCKET_LABELS[type] ?? type, count: c.Quantity ?? 1, powerKw: c.PowerKW ?? null };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    const powers = sockets.map((s) => s.powerKw).filter((p): p is number => p !== null);
    const maxPowerKw = powers.length ? Math.max(...powers) : null;
    const { price, note } = parseUsageCost(s.UsageCost);

    return {
      id: `ocm_${s.ID}`,
      name: s.AddressInfo.Title,
      operator: s.OperatorInfo?.Title ?? 'Onbekend',
      lat: s.AddressInfo.Latitude,
      lon: s.AddressInfo.Longitude,
      address: s.AddressInfo.AddressLine1 ?? '',
      city: s.AddressInfo.Town ?? '',
      capacity: s.NumberOfPoints ?? (conns.reduce((n, c) => n + (c.Quantity ?? 1), 0) || 1),
      maxPowerKw,
      sockets,
      isFastCharger: (maxPowerKw ?? 0) >= 50,
      pricePerKwh: price,
      priceNote: note,
      distanceKm: s.AddressInfo.Distance ?? undefined,
    };
  });
}

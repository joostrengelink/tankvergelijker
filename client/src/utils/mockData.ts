import type { Station } from '../types';

const BRANDS = ['Shell', 'BP', 'Esso', 'Tango', 'Tinq', 'Tamoil', 'Q8', 'Gulf'];
const HOURS = ['06:00 – 22:00', '00:00 – 24:00', '24/7', '07:00 – 21:00'];

function offset(base: number, delta: number): number {
  return base + (Math.random() - 0.5) * 2 * delta;
}

export function generateMockStations(centerLat: number, centerLon: number): Station[] {
  return Array.from({ length: 12 }, (_, i) => {
    const brand = BRANDS[i % BRANDS.length];
    const lat = offset(centerLat, 0.06);
    const lon = offset(centerLon, 0.1);
    return {
      id: `mock-${i}`,
      name: `${brand} ${['Noord', 'Zuid', 'Oost', 'West', 'Centrum'][i % 5]}`,
      brand,
      address: `Voorbeeldstraat ${10 + i * 7}`,
      city: 'Voorbeeldstad',
      lat,
      lon,
      prices: {
        euro95: parseFloat((1.75 + Math.random() * 0.30).toFixed(3)),
        diesel: parseFloat((1.55 + Math.random() * 0.25).toFixed(3)),
        superplus98: parseFloat((1.95 + Math.random() * 0.30).toFixed(3)),
        lpg: parseFloat((0.85 + Math.random() * 0.15).toFixed(3)),
      },
      openingHours: HOURS[i % HOURS.length],
      lastUpdated: new Date().toISOString(),
    };
  });
}

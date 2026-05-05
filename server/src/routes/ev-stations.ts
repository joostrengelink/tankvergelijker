import { Router } from 'express';
import { fetchEVStations, type EVStation } from '../services/overpass';
import { fetchEVStationsFromOCM } from '../services/ocm';
import { MemoryCache } from '../cache/memoryCache';

const router = Router();
const cache = new MemoryCache<EVStation[]>(20 * 60 * 1000);

router.get('/', async (req, res) => {
  const lat = parseFloat(req.query.lat as string);
  const lon = parseFloat(req.query.lon as string);
  const radius = parseFloat((req.query.radius as string) ?? '10');

  if (isNaN(lat) || isNaN(lon)) {
    res.status(400).json({ error: 'lat en lon zijn vereist' });
    return;
  }

  const cacheKey = `ev_${lat.toFixed(3)},${lon.toFixed(3)},${radius}`;
  const cached = cache.get(cacheKey);
  if (cached) { res.json(cached); return; }

  // Try OCM first (real pricing), fall back to Overpass (OSM data)
  if (process.env.OCM_API_KEY) {
    try {
      const stations = await fetchEVStationsFromOCM(lat, lon, radius);
      cache.set(cacheKey, stations);
      res.json(stations);
      return;
    } catch (err) {
      console.warn('OCM fout, val terug op Overpass:', err);
    }
  }

  try {
    const stations = await fetchEVStations(lat, lon, radius);
    cache.set(cacheKey, stations);
    res.json(stations);
  } catch (err) {
    console.error('Overpass error:', err);
    res.status(503).json({ error: 'Kon laadpaaldata niet ophalen' });
  }
});

export default router;

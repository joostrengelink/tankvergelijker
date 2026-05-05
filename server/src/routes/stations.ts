import { Router } from 'express';
import { fetchStationsFromAnwb } from '../services/anwb';
import { MemoryCache } from '../cache/memoryCache';
import type { Station } from '../../../shared/types';

const router = Router();
const cache = new MemoryCache<Station[]>(15 * 60 * 1000); // 15 minutes

router.get('/', async (req, res) => {
  const lat = parseFloat(req.query.lat as string);
  const lon = parseFloat(req.query.lon as string);
  const radius = parseFloat((req.query.radius as string) ?? '10');

  if (isNaN(lat) || isNaN(lon)) {
    res.status(400).json({ error: 'lat and lon zijn vereist' });
    return;
  }

  const cacheKey = `${lat.toFixed(3)},${lon.toFixed(3)},${radius}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    res.json(cached);
    return;
  }

  try {
    const stations = await fetchStationsFromAnwb(lat, lon, radius);
    cache.set(cacheKey, stations);
    res.json(stations);
  } catch (err) {
    console.error('ANWB fetch error:', err);
    res.status(503).json({ error: 'Kon stationsdata niet ophalen' });
  }
});

export default router;

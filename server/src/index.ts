import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import stationsRouter from './routes/stations';
import evStationsRouter from './routes/ev-stations';

dotenv.config({ path: '../../.env' });

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'capacitor://localhost',
    'ionic://localhost',
    'http://localhost',
  ],
}));
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({ status: 'ok', service: 'TankVergelijker API', endpoints: ['/api/stations', '/api/ev-stations'] });
});

app.use('/api/stations', stationsRouter);
app.use('/api/ev-stations', evStationsRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

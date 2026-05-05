import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Station, FuelType } from '../types';
import type { EVStation, AppMode } from '../types/ev';

import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl });

interface Props {
  center: [number, number] | null;
  stations: Station[];
  evStations: EVStation[];
  mode: AppMode;
  selectedFuel: FuelType;
  hoveredId: string | null;
  selectedId: string | null;
  cheapestId: string | null;
  onMarkerClick: (id: string) => void;
}

function FuelMarkerLayer({ stations, selectedFuel, hoveredId, selectedId, cheapestId, onMarkerClick }: Pick<Props, 'stations' | 'selectedFuel' | 'hoveredId' | 'selectedId' | 'cheapestId' | 'onMarkerClick'>) {
  const map = useMap();
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  useEffect(() => {
    const existing = markersRef.current;
    for (const [id, m] of existing) {
      if (!stations.find((s) => s.id === id)) { m.remove(); existing.delete(id); }
    }
    for (const s of stations) {
      const price = s.prices[selectedFuel];
      const isActive = hoveredId === s.id || selectedId === s.id;
      const isCheapest = s.id === cheapestId && !isActive;
      const cls = ['price-marker', isActive ? 'hovered' : '', isCheapest ? 'cheapest' : ''].filter(Boolean).join(' ');
      const icon = L.divIcon({
        html: `<div class="${cls}">${price !== undefined ? '€' + price.toFixed(3) : '—'}</div>`,
        className: '', iconAnchor: [28, 14],
      });
      const m = existing.get(s.id);
      if (m) { m.setIcon(icon); }
      else {
        const marker = L.marker([s.lat, s.lon], { icon }).addTo(map)
          .bindPopup(`<strong>${s.name}</strong><br/>${s.address}, ${s.city}${s.openingHours ? `<br/><small>${s.openingHours}</small>` : ''}`);
        marker.on('click', () => onMarkerClick(s.id));
        existing.set(s.id, marker);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stations, selectedFuel, hoveredId, selectedId, cheapestId]);

  useEffect(() => {
    if (!selectedId) return;
    const m = markersRef.current.get(selectedId);
    if (m) { map.flyTo(m.getLatLng(), Math.max(map.getZoom(), 14), { duration: 0.8 }); m.openPopup(); }
  }, [selectedId, map]);

  // Clear markers when component unmounts or mode changes
  useEffect(() => () => { markersRef.current.forEach((m) => m.remove()); markersRef.current.clear(); }, []);

  return null;
}

function EVMarkerLayer({ stations, hoveredId, selectedId, onMarkerClick }: { stations: EVStation[]; hoveredId: string | null; selectedId: string | null; onMarkerClick: (id: string) => void }) {
  const map = useMap();
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  useEffect(() => {
    const existing = markersRef.current;
    for (const [id, m] of existing) {
      if (!stations.find((s) => s.id === id)) { m.remove(); existing.delete(id); }
    }
    for (const s of stations) {
      const isActive = hoveredId === s.id || selectedId === s.id;
      const color = isActive ? '#00E5FF' : s.isFastCharger ? '#00E5FF' : '#ffffff';
      const bg = isActive ? '#00E5FF' : s.isFastCharger ? 'rgba(0,229,255,0.15)' : 'rgba(255,255,255,0.08)';
      const border = isActive ? '#00E5FF' : s.isFastCharger ? 'rgba(0,229,255,0.5)' : 'rgba(255,255,255,0.2)';
      const html = `<div style="background:${bg};color:${color};border:2px solid ${border};border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.5);font-size:13px;${isActive ? 'transform:scale(1.2);box-shadow:0 0 12px rgba(0,229,255,0.4);' : ''}">⚡</div>`;
      const icon = L.divIcon({ html, className: '', iconAnchor: [11, 11] });
      const m = existing.get(s.id);
      if (m) { m.setIcon(icon); }
      else {
        const sockets = s.sockets.map((sk) => `${sk.label}${sk.powerKw ? ` ${sk.powerKw}kW` : ''}`).join(', ');
        const marker = L.marker([s.lat, s.lon], { icon }).addTo(map)
          .bindPopup(`<strong>${s.name}</strong><br/>${s.operator}<br/>${s.capacity} laadpunt(en)${sockets ? `<br/><small>${sockets}</small>` : ''}`);
        marker.on('click', () => onMarkerClick(s.id));
        existing.set(s.id, marker);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stations, hoveredId, selectedId]);

  useEffect(() => {
    if (!selectedId) return;
    const m = markersRef.current.get(selectedId);
    if (m) { map.flyTo(m.getLatLng(), Math.max(map.getZoom(), 15), { duration: 0.8 }); m.openPopup(); }
  }, [selectedId, map]);

  useEffect(() => () => { markersRef.current.forEach((m) => m.remove()); markersRef.current.clear(); }, []);

  return null;
}

function RecenterMap({ center }: { center: [number, number] | null }) {
  const map = useMap();
  const prev = useRef('');
  useEffect(() => {
    if (!center) return;
    const key = `${center[0]},${center[1]}`;
    if (key === prev.current) return;
    prev.current = key;
    map.flyTo(center, 12, { duration: 1 });
  }, [center, map]);
  return null;
}

export default function MapView({ center, stations, evStations, mode, selectedFuel, hoveredId, selectedId, cheapestId, onMarkerClick }: Props) {
  return (
    <MapContainer center={center ?? [52.3676, 4.9041]} zoom={center ? 12 : 7} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
      />
      <RecenterMap center={center} />
      {mode === 'fuel' && (
        <FuelMarkerLayer
          stations={stations} selectedFuel={selectedFuel}
          hoveredId={hoveredId} selectedId={selectedId}
          cheapestId={cheapestId} onMarkerClick={onMarkerClick}
        />
      )}
      {mode === 'ev' && (
        <EVMarkerLayer
          stations={evStations} hoveredId={hoveredId}
          selectedId={selectedId} onMarkerClick={onMarkerClick}
        />
      )}
    </MapContainer>
  );
}

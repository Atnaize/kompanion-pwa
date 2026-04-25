import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, useMap } from 'react-leaflet';
import type { LatLngBoundsExpression } from 'leaflet';
import polyline from '@mapbox/polyline';
import 'leaflet/dist/leaflet.css';

type LatLng = [number, number];

interface ActivityMapProps {
  encodedPolyline?: string;
  streamCoords?: LatLng[];
  className?: string;
}

const FitBounds = ({ bounds }: { bounds: LatLngBoundsExpression | null }) => {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [24, 24] });
    }
  }, [bounds, map]);
  return null;
};

export const ActivityMap = ({ encodedPolyline, streamCoords, className }: ActivityMapProps) => {
  const coordinates: LatLng[] = useMemo(() => {
    if (streamCoords && streamCoords.length > 0) {
      return streamCoords;
    }
    if (encodedPolyline) {
      try {
        return polyline.decode(encodedPolyline) as LatLng[];
      } catch {
        return [];
      }
    }
    return [];
  }, [encodedPolyline, streamCoords]);

  if (coordinates.length < 2) {
    return (
      <div
        className={`flex h-64 items-center justify-center rounded-xl bg-gray-100 text-sm text-gray-500 dark:bg-gray-800 dark:text-gray-400 ${className ?? ''}`}
      >
        No route data for this activity
      </div>
    );
  }

  const bounds: LatLngBoundsExpression = coordinates as LatLngBoundsExpression;
  const start = coordinates[0];
  const end = coordinates[coordinates.length - 1];

  return (
    <div className={`overflow-hidden rounded-xl ${className ?? ''}`}>
      <MapContainer
        bounds={bounds}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%', minHeight: 280 }}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
        />
        <FitBounds bounds={bounds} />
        <Polyline
          positions={coordinates}
          pathOptions={{ color: '#fc4c02', weight: 4, opacity: 0.9 }}
        />
        <CircleMarker
          center={start}
          radius={7}
          pathOptions={{ color: 'white', fillColor: '#16a34a', fillOpacity: 1, weight: 2 }}
        />
        <CircleMarker
          center={end}
          radius={7}
          pathOptions={{ color: 'white', fillColor: '#dc2626', fillOpacity: 1, weight: 2 }}
        />
      </MapContainer>
    </div>
  );
};

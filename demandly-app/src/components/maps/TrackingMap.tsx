'use client';

import React, { useEffect, useState } from 'react';
import styles from './TrackingMap.module.css';

// Dynamically import Leaflet (SSR-unsafe) or Google Maps based on env
const MAP_PROVIDER = process.env.NEXT_PUBLIC_MAP_PROVIDER || 'leaflet';

interface TrackingMapProps {
  origin?: { lat: number; lng: number } | null;
  destination?: { lat: number; lng: number } | null;
  current?: { lat: number; lng: number } | null;
  status?: string;
  height?: string;
}

export default function TrackingMap({ origin, destination, current, status, height = '350px' }: TrackingMapProps) {
  const [MapComponent, setMapComponent] = useState<React.ComponentType<TrackingMapProps> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (MAP_PROVIDER === 'google') {
      import('./GoogleMapView').then(m => setMapComponent(() => m.default)).catch(() => setError('Failed to load Google Maps'));
    } else {
      import('./LeafletMapView').then(m => setMapComponent(() => m.default)).catch(e => { console.error(e); setError('Failed to load map'); });
    }
  }, []);

  if (error) {
    return (
      <div className={styles.fallback} style={{ height }}>
        <div className={styles.fallbackIcon}>🗺️</div>
        <p className={styles.fallbackText}>{error}</p>
      </div>
    );
  }

  if (!MapComponent) {
    return (
      <div className={styles.fallback} style={{ height }}>
        <div className={styles.loader} />
        <p className={styles.fallbackText}>Loading map...</p>
      </div>
    );
  }

  return <MapComponent origin={origin} destination={destination} current={current} status={status} height={height} />;
}

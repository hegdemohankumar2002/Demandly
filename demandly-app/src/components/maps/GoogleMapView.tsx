'use client';

import React from 'react';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';

const GOOGLE_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || '';

interface GoogleMapProps {
  origin?: { lat: number; lng: number } | null;
  destination?: { lat: number; lng: number } | null;
  current?: { lat: number; lng: number } | null;
  status?: string;
  height?: string;
}

export default function GoogleMapView({ origin, destination, current, status, height = '350px' }: GoogleMapProps) {
  if (!GOOGLE_MAPS_KEY) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', borderRadius: 12, color: '#666' }}>
        <p>Set <code>NEXT_PUBLIC_GOOGLE_MAPS_KEY</code> to enable Google Maps</p>
      </div>
    );
  }

  const center = current || origin || destination || { lat: 20.5937, lng: 78.9629 };

  return (
    <div style={{ height, borderRadius: 12, overflow: 'hidden' }}>
      <APIProvider apiKey={GOOGLE_MAPS_KEY}>
        <Map
          style={{ width: '100%', height: '100%' }}
          defaultCenter={center}
          defaultZoom={6}
          mapId="demandly-tracking"
          gestureHandling="greedy"
        >
          {origin && (
            <AdvancedMarker position={origin} title="Origin — Manufacturer">
              <Pin background="#4285F4" glyphColor="#fff" borderColor="#1a73e8" scale={1.2} />
            </AdvancedMarker>
          )}
          {destination && (
            <AdvancedMarker position={destination} title="Destination — Consumer">
              <Pin background="#EA4335" glyphColor="#fff" borderColor="#c5221f" scale={1.2} />
            </AdvancedMarker>
          )}
          {current && status === 'shipped' && (
            <AdvancedMarker position={current} title="Shipment — En Route">
              <div style={{ fontSize: 28, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>🚛</div>
            </AdvancedMarker>
          )}
        </Map>
      </APIProvider>
    </div>
  );
}

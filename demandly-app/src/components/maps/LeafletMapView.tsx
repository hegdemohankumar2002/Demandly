'use client';

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import styles from './TrackingMap.module.css';

interface LeafletMapProps {
  origin?: { lat: number; lng: number } | null;
  destination?: { lat: number; lng: number } | null;
  current?: { lat: number; lng: number } | null;
  status?: string;
  height?: string;
}

// Custom icon factory
function createIcon(emoji: string, size: number = 32) {
  return L.divIcon({
    html: `<div style="font-size:${size}px;text-align:center;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3))">${emoji}</div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export default function LeafletMapView({ origin, destination, current, status, height = '350px' }: LeafletMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Layer[]>([]);
  const routeRef = useRef<L.Polyline | null>(null);

  // Initialize map once
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const defaultCenter: L.LatLngExpression = [20.5937, 78.9629]; // India center
    const map = L.map(mapRef.current, {
      center: defaultCenter,
      zoom: 5,
      zoomControl: true,
      attributionControl: true,
    });

    // OpenStreetMap tiles — clean and free
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map);

    mapInstance.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  // Update markers + route when data changes
  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    // Clear old markers
    markersRef.current.forEach(m => map.removeLayer(m));
    markersRef.current = [];
    if (routeRef.current) { map.removeLayer(routeRef.current); routeRef.current = null; }

    const bounds: L.LatLngExpression[] = [];

    // Origin marker (manufacturer)
    if (origin) {
      const marker = L.marker([origin.lat, origin.lng], { icon: createIcon('🏭', 30) })
        .bindPopup('<strong>Origin</strong><br/>Manufacturer Location')
        .addTo(map);
      markersRef.current.push(marker);
      bounds.push([origin.lat, origin.lng]);
    }

    // Destination marker (consumer)
    if (destination) {
      const marker = L.marker([destination.lat, destination.lng], { icon: createIcon('🏠', 28) })
        .bindPopup('<strong>Destination</strong><br/>Delivery Address')
        .addTo(map);
      markersRef.current.push(marker);
      bounds.push([destination.lat, destination.lng]);
    }

    // Current position (truck — only when shipped)
    if (current && (status === 'shipped' || !status)) {
      const marker = L.marker([current.lat, current.lng], { icon: createIcon('🚛', 34) })
        .bindPopup('<strong>Shipment</strong><br/>Current Location')
        .addTo(map);
      markersRef.current.push(marker);
      bounds.push([current.lat, current.lng]);
    }

    // Draw route from OSRM (free routing engine)
    if (origin && destination) {
      fetchRoute(origin, destination, current).then(routeLine => {
        if (routeLine && mapInstance.current) {
          routeRef.current = routeLine.addTo(mapInstance.current);
        }
      });
    }

    // Fit bounds
    if (bounds.length > 1) {
      map.fitBounds(L.latLngBounds(bounds), { padding: [50, 50], maxZoom: 12 });
    } else if (bounds.length === 1) {
      map.setView(bounds[0], 10);
    }
  }, [origin, destination, current, status]);

  return <div ref={mapRef} className={styles.mapContainer} style={{ height }} />;
}

/**
 * Fetch a route from OSRM (free, no API key).
 * Draws the actual road path between origin and destination.
 */
async function fetchRoute(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  current?: { lat: number; lng: number } | null
): Promise<L.Polyline | null> {
  try {
    // Build waypoints: origin → (current if exists) → destination
    const waypoints = [
      `${origin.lng},${origin.lat}`,
      ...(current ? [`${current.lng},${current.lat}`] : []),
      `${destination.lng},${destination.lat}`,
    ].join(';');

    const url = `https://router.project-osrm.org/route/v1/driving/${waypoints}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();
    if (!data.routes || data.routes.length === 0) return null;

    const coords = data.routes[0].geometry.coordinates.map(
      (c: [number, number]) => [c[1], c[0]] as L.LatLngExpression
    );

    // Draw route with a nice gradient-like style
    return L.polyline(coords, {
      color: '#4285F4',
      weight: 4,
      opacity: 0.7,
      dashArray: current ? '8, 12' : undefined,
      lineCap: 'round',
    });
  } catch (err) {
    console.warn('[MAP] Route fetch failed:', err);
    return null;
  }
}

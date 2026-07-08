'use client';

import React, { useState, useEffect, useCallback } from 'react';
import styles from './tracking.module.css';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { formatCurrency, getStatusLabel } from '@/lib/utils';
import { API_URL } from '@/lib/api';
import { MapPin, Package, Truck, CheckCircle, Navigation, Crosshair } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import dynamic from 'next/dynamic';

const TrackingMap = dynamic(() => import('@/components/maps/TrackingMap'), { ssr: false });

interface TrackingOrder {
  id: string;
  product?: { name: string };
  status: string;
  quantity: number;
  totalPrice: number;
  trackingId?: string;
  paymentStatus?: string;
  estimatedDelivery: string;
  originLat?: number;
  originLng?: number;
  destLat?: number;
  destLng?: number;
  currentLat?: number;
  currentLng?: number;
}

export default function TrackingPage() {
  const { token } = useAuthStore();
  const { addToast } = useToast();
  const [orders, setOrders] = useState<TrackingOrder[]>([]);
  const [selected, setSelected] = useState<TrackingOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);

  const fetchOrders = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    try {
      const res = await fetch(`${API_URL}/manufacturer/fulfilment`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
        if (data.length > 0 && !selected) setSelected(data[0]);
        if (selected) {
          const updated = data.find((o: TrackingOrder) => o.id === selected.id);
          if (updated) setSelected(updated);
        }
      }
    } catch {
      console.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  }, [token, selected]);

  useEffect(() => { 
    let cancelled = false;
    const doFetch = async () => {
      await fetchOrders();
    };
    doFetch();
    return () => { cancelled = true; };
  }, [fetchOrders]);

  const getStepIndex = (status: string) => {
    const steps = ['confirmed', 'manufacturing', 'shipped', 'delivered'];
    return steps.indexOf(status);
  };

  // Simulate GPS movement along the route (dev tool)
  const simulateGPS = async () => {
    if (!selected || selected.currentLat === undefined || selected.currentLng === undefined || selected.destLat === undefined || selected.destLng === undefined) {
      addToast({ type: 'error', title: 'Cannot simulate', message: 'Order needs origin/destination/current coordinates. Mark as shipped first.' });
      return;
    }
    setSimulating(true);

    // Move 20% closer to destination
    const progress = 0.2;
    const newLat = selected.currentLat + (selected.destLat - selected.currentLat) * progress;
    const newLng = selected.currentLng + (selected.destLng - selected.currentLng) * progress;

    try {
      const res = await fetch(`${API_URL}/manufacturer/fulfilment/${selected.id}/location`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat: newLat, lng: newLng })
      });
      if (res.ok) {
        addToast({ type: 'success', title: 'GPS Updated', message: `Moved to ${newLat.toFixed(4)}, ${newLng.toFixed(4)}` });
        fetchOrders();
      }
} catch {
        addToast({ type: 'error', title: 'Error', message: 'Failed to update GPS' });
      } finally {
      setSimulating(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading tracking data...</div>;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}><Navigation size={24} /> Delivery Tracking</h1>
        <p className={styles.subtitle}>Real-time GPS tracking for all shipments</p>
      </div>

      <div className={styles.layout}>
        {/* Order List */}
        <div className={styles.sidebar}>
          <h3 className={styles.sidebarTitle}>Orders ({orders.length})</h3>
          {orders.map(order => (
            <button
              key={order.id}
              className={`${styles.orderCard} ${selected?.id === order.id ? styles.orderCardActive : ''}`}
              onClick={() => setSelected(order)}
            >
              <div className={styles.orderInfo}>
                <span className={styles.orderProduct}>{order.product?.name}</span>
                <span className={styles.orderMeta}>{order.quantity} units · {formatCurrency(order.totalPrice)}</span>
              </div>
              <Badge
                variant={order.status === 'delivered' ? 'success' : order.status === 'shipped' ? 'accent' : 'default'}
                size="sm" dot
              >
                {getStatusLabel(order.status)}
              </Badge>
            </button>
          ))}
          {orders.length === 0 && (
            <p className={styles.emptyText}>No orders to track.</p>
          )}
        </div>

        {/* Map + Details */}
        <div className={styles.main}>
          {selected ? (
            <>
              {/* Map */}
              <Card variant="default" padding="none" className={styles.mapCard}>
                <TrackingMap
                  origin={selected.originLat && selected.originLng ? { lat: selected.originLat, lng: selected.originLng } : null}
                  destination={selected.destLat && selected.destLng ? { lat: selected.destLat, lng: selected.destLng } : null}
                  current={selected.currentLat && selected.currentLng ? { lat: selected.currentLat, lng: selected.currentLng } : null}
                  status={selected.status}
                  height="350px"
                />
              </Card>

              {/* Dev: Simulate GPS */}
              {selected.status === 'shipped' && selected.originLat && (
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Crosshair size={14} />}
                  loading={simulating}
                  onClick={simulateGPS}
                  style={{ alignSelf: 'flex-end' }}
                >
                  Simulate GPS Movement
                </Button>
              )}

              {/* Status Pipeline */}
              <Card variant="default" padding="md" className={styles.statusCard}>
                <div className={styles.pipeline}>
                  {['confirmed', 'manufacturing', 'shipped', 'delivered'].map((step, i) => {
                    const current = getStepIndex(selected.status);
                    const done = i <= current;
                    const icons = [<CheckCircle key="c" size={18} />, <Package key="m" size={18} />, <Truck key="s" size={18} />, <MapPin key="d" size={18} />];
                    return (
                      <div key={step} className={`${styles.step} ${done ? styles.stepDone : ''} ${i === current ? styles.stepCurrent : ''}`}>
                        <div className={styles.stepIcon}>{icons[i]}</div>
                        <span className={styles.stepLabel}>{getStatusLabel(step)}</span>
                        {i < 3 && <div className={`${styles.stepLine} ${done && i < current ? styles.stepLineDone : ''}`} />}
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Order Details */}
              <Card variant="default" padding="md" className={styles.detailsCard}>
                <div className={styles.detailsGrid}>
                  <div className={styles.detail}>
                    <span className={styles.detailLabel}>Tracking ID</span>
                    <span className={styles.detailValue}>{selected.trackingId || '—'}</span>
                  </div>
                  <div className={styles.detail}>
                    <span className={styles.detailLabel}>Product</span>
                    <span className={styles.detailValue}>{selected.product?.name}</span>
                  </div>
                  <div className={styles.detail}>
                    <span className={styles.detailLabel}>Quantity</span>
                    <span className={styles.detailValue}>{selected.quantity} units</span>
                  </div>
                  <div className={styles.detail}>
                    <span className={styles.detailLabel}>Total</span>
                    <span className={styles.detailValue}>{formatCurrency(selected.totalPrice)}</span>
                  </div>
                  <div className={styles.detail}>
                    <span className={styles.detailLabel}>Payment</span>
                    <Badge variant={selected.paymentStatus === 'paid' ? 'success' : 'warning'} size="sm">
                      {selected.paymentStatus?.toUpperCase() || 'PENDING'}
                    </Badge>
                  </div>
                  <div className={styles.detail}>
                    <span className={styles.detailLabel}>ETA</span>
                    <span className={styles.detailValue}>
                      {new Date(selected.estimatedDelivery).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              </Card>
            </>
          ) : (
            <Card padding="lg" style={{ textAlign: 'center', padding: '3rem' }}>
              <Truck size={40} style={{ margin: '0 auto 0.75rem', color: 'var(--text-tertiary)' }} />
              <p style={{ color: 'var(--text-secondary)' }}>Select an order to view tracking details</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

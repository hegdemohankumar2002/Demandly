'use client';

import React, { useState, useEffect, useCallback } from 'react';
import styles from './tracking.module.css';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { useAuthStore } from '@/stores/authStore';
import { formatCurrency, getStatusLabel } from '@/lib/utils';
import { API_URL } from '@/lib/api';
import { Navigation, Package, Truck, CheckCircle, Factory, MapPin } from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamic import to avoid SSR issues with Leaflet
const TrackingMap = dynamic(() => import('@/components/maps/TrackingMap'), { ssr: false });

interface TrackingOrder {
  id: string;
  product?: { name: string; unit: string };
  manufacturer?: { name: string; companyName?: string };
  status: string;
  quantity: number;
  totalPrice: number;
  trackingId?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  deliveredAt?: string;
  estimatedDelivery: string;
  originLat?: number;
  originLng?: number;
  destLat?: number;
  destLng?: number;
  currentLat?: number;
  currentLng?: number;
}

export default function ConsumerTrackingPage() {
  const { token } = useAuthStore();
  const [orders, setOrders] = useState<TrackingOrder[]>([]);
  const [selected, setSelected] = useState<TrackingOrder | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    try {
      const res = await fetch(`${API_URL}/consumer/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Only show orders that have progressed past confirmation
        const trackable = (data.orders || []).filter(
          (o: TrackingOrder) => ['confirmed', 'manufacturing', 'shipped', 'delivered'].includes(o.status)
        );
        setOrders(trackable);
        // Pre-select from URL param or first order
        const params = new URLSearchParams(window.location.search);
        const orderId = params.get('order');
        const match = trackable.find((o: TrackingOrder) => o.id === orderId);
        if (match) setSelected(match);
        else if (trackable.length > 0 && !selected) setSelected(trackable[0]);
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

  // Auto-refresh GPS every 30s for shipped orders
  useEffect(() => {
    if (!selected || selected.status !== 'shipped') return;
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, [selected, fetchOrders]);

  const getStepIndex = (status: string) => {
    const steps = ['confirmed', 'manufacturing', 'shipped', 'delivered'];
    return steps.indexOf(status);
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading tracking data...</div>;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}><Navigation size={24} /> Track My Orders</h1>
        <p className={styles.subtitle}>Real-time GPS tracking for your deliveries</p>
      </div>

      <div className={styles.layout}>
        {/* Order List Sidebar */}
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
                <span className={styles.orderMeta}>
                  {order.quantity} units · {formatCurrency(order.totalPrice)}
                </span>
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
            <div className={styles.emptyState}>
              <Package size={32} />
              <p>No trackable orders yet.</p>
              <span>Orders will appear here once confirmed.</span>
            </div>
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
                  height="380px"
                />
                {!selected.originLat && (
                  <div className={styles.mapOverlay}>
                    <MapPin size={20} />
                    <span>GPS tracking will activate once the order is shipped</span>
                  </div>
                )}
              </Card>

              {/* Status Pipeline */}
              <Card variant="default" padding="md">
                <div className={styles.pipeline}>
                  {['confirmed', 'manufacturing', 'shipped', 'delivered'].map((step, i) => {
                    const currentIdx = getStepIndex(selected.status);
                    const done = i <= currentIdx;
                    const isCurrent = i === currentIdx;
                    const icons = [
                      <CheckCircle key="c" size={18} />,
                      <Factory key="m" size={18} />,
                      <Truck key="s" size={18} />,
                      <MapPin key="d" size={18} />
                    ];
                    return (
                      <div key={step} className={`${styles.step} ${done ? styles.stepDone : ''} ${isCurrent ? styles.stepCurrent : ''}`}>
                        <div className={styles.stepIcon}>{icons[i]}</div>
                        <span className={styles.stepLabel}>{getStatusLabel(step)}</span>
                        {i < 3 && <div className={`${styles.stepLine} ${done && i < currentIdx ? styles.stepLineDone : ''}`} />}
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Order Details */}
              <Card variant="default" padding="md">
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
                    <span className={styles.detailValue}>{selected.quantity} {selected.product?.unit}</span>
                  </div>
                  <div className={styles.detail}>
                    <span className={styles.detailLabel}>Total</span>
                    <span className={styles.detailValue}>{formatCurrency(selected.totalPrice)}</span>
                  </div>
                  <div className={styles.detail}>
                    <span className={styles.detailLabel}>Manufacturer</span>
                    <span className={styles.detailValue}>{selected.manufacturer?.companyName || selected.manufacturer?.name || '—'}</span>
                  </div>
                  <div className={styles.detail}>
                    <span className={styles.detailLabel}>Est. Delivery</span>
                    <span className={styles.detailValue}>
                      {new Date(selected.estimatedDelivery).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <div className={styles.detail}>
                    <span className={styles.detailLabel}>Payment</span>
                    <Badge variant={selected.paymentStatus === 'paid' ? 'success' : 'warning'} size="sm">
                      {selected.paymentMethod === 'cod' ? 'COD' : 'Online'} · {selected.paymentStatus?.toUpperCase()}
                    </Badge>
                  </div>
                  {selected.deliveredAt && (
                    <div className={styles.detail}>
                      <span className={styles.detailLabel}>Delivered On</span>
                      <span className={styles.detailValue}>
                        {new Date(selected.deliveredAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            </>
          ) : (
            <Card padding="lg" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
              <Truck size={48} style={{ margin: '0 auto 1rem', color: 'var(--text-tertiary)' }} />
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '0.5rem' }}>Select an order to track</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Click an order from the sidebar to view its live tracking details.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

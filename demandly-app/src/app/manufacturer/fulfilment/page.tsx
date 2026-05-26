'use client';

import React, { useState, useEffect } from 'react';
import styles from './fulfilment.module.css';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/components/ui/Toast';
import { formatCurrency, getStatusLabel } from '@/lib/utils';
import { API_URL } from '@/lib/api';
import { Package, Truck, CheckCircle, MapPin, ArrowRight } from 'lucide-react';

const statusSteps = ['confirmed', 'manufacturing', 'shipped', 'delivered'];

export default function FulfilmentPage() {
  const { token } = useAuthStore();
  const { addToast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    const fetchOrders = async () => {
      try {
        const res = await fetch(`${API_URL}/manufacturer/fulfilment`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) setOrders(await res.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [token]);

  const advanceStatus = async (orderId: string, currentStatus: string) => {
    const currentIdx = statusSteps.indexOf(currentStatus);
    if (currentIdx >= statusSteps.length - 1) return;
    const nextStatus = statusSteps[currentIdx + 1];

    setUpdating(orderId);
    try {
      const res = await fetch(`${API_URL}/manufacturer/fulfilment/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        const updated = await res.json();
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...updated } : o));
        addToast({ type: 'success', title: 'Status Updated', message: `Order moved to "${getStatusLabel(nextStatus)}"` });
      }
    } catch (err) {
      addToast({ type: 'error', title: 'Error', message: 'Failed to update order status.' });
    } finally {
      setUpdating(null);
    }
  };

  const filtered = filter === 'All' ? orders : orders.filter(o => o.status === filter);

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading orders...</div>;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Fulfilment</h1>
          <p className={styles.subtitle}>Manage orders, update production status, and track deliveries.</p>
        </div>
      </div>

      {/* Stats */}
      <div className={styles.statsRow}>
        <Card variant="glass" padding="md" className={styles.statCard}>
          <span className={styles.statValue}>{orders.length}</span>
          <span className={styles.statLabel}>Total Orders</span>
        </Card>
        <Card variant="glass" padding="md" className={styles.statCard}>
          <span className={styles.statValue}>{orders.filter(o => o.status === 'manufacturing' || o.status === 'confirmed').length}</span>
          <span className={styles.statLabel}>In Production</span>
        </Card>
        <Card variant="glass" padding="md" className={styles.statCard}>
          <span className={styles.statValue}>{orders.filter(o => o.status === 'shipped').length}</span>
          <span className={styles.statLabel}>In Transit</span>
        </Card>
        <Card variant="glass" padding="md" className={styles.statCard}>
          <span className={styles.statValue}>{orders.filter(o => o.status === 'delivered').length}</span>
          <span className={styles.statLabel}>Delivered</span>
        </Card>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        {['All', ...statusSteps].map(s => (
          <button key={s} className={`${styles.filterBtn} ${filter === s ? styles.filterActive : ''}`} onClick={() => setFilter(s)}>
            {s === 'All' ? 'All Orders' : getStatusLabel(s)}
          </button>
        ))}
      </div>

      {/* Order List */}
      <div className={styles.list}>
        {filtered.map((order) => {
          const stepIdx = statusSteps.indexOf(order.status);
          const estDate = new Date(order.estimatedDelivery).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

          return (
            <Card key={order.id} variant="default" padding="lg" className={styles.orderCard}>
              <div className={styles.cardTop}>
                <div className={styles.orderInfo}>
                  <h3 className={styles.productName}>{order.product?.name}</h3>
                  <span className={styles.orderId}>Order #{order.id.slice(0, 8)}</span>
                </div>
                <Badge
                  variant={order.status === 'delivered' ? 'success' : order.status === 'shipped' ? 'accent' : order.status === 'manufacturing' ? 'warning' : 'primary'}
                  dot pulse={order.status !== 'delivered'}
                >
                  {getStatusLabel(order.status)}
                </Badge>
              </div>

              <div className={styles.detailsRow}>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Quantity</span>
                  <span className={styles.detailValue}>{order.quantity} units</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Total Value</span>
                  <span className={styles.detailValueHighlight}>{formatCurrency(order.totalPrice)}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Est. Delivery</span>
                  <span className={styles.detailValue}>{estDate}</span>
                </div>
                {order.trackingId && (
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Tracking</span>
                    <span className={styles.detailValue}>{order.trackingId}</span>
                  </div>
                )}
              </div>

              {/* Progress Steps */}
              <div className={styles.steps}>
                {statusSteps.map((step, i) => (
                  <div key={step} className={`${styles.step} ${i <= stepIdx ? styles.stepDone : ''} ${i === stepIdx ? styles.stepCurrent : ''}`}>
                    <div className={styles.stepDot}>
                      {i < stepIdx ? <CheckCircle size={14} /> : <span className={styles.dotInner} />}
                    </div>
                    <span className={styles.stepLabel}>{getStatusLabel(step)}</span>
                    {i < statusSteps.length - 1 && <div className={`${styles.stepLine} ${i < stepIdx ? styles.stepLineDone : ''}`} />}
                  </div>
                ))}
              </div>

              {order.status !== 'delivered' && (
                <div className={styles.cardActions}>
                  <Button
                    size="sm"
                    variant="primary"
                    iconRight={<ArrowRight size={14} />}
                    loading={updating === order.id}
                    onClick={() => advanceStatus(order.id, order.status)}
                  >
                    Mark as {getStatusLabel(statusSteps[stepIdx + 1] || 'delivered')}
                  </Button>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <Card padding="lg" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <Package size={48} style={{ margin: '0 auto 1rem', color: 'var(--text-tertiary)' }} />
          <h2 style={{ fontSize: '18px', fontWeight: '500', marginBottom: '0.5rem' }}>No orders found</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Win bids to start receiving fulfilment orders.</p>
        </Card>
      )}
    </div>
  );
}

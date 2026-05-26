'use client';

import React, { useState, useEffect } from 'react';
import styles from './subscriptions.module.css';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/components/ui/Toast';
import { formatCurrency, getStatusLabel } from '@/lib/utils';
import { API_URL } from '@/lib/api';
import { RefreshCw, Package, Calendar, Pause, Play, X, Truck } from 'lucide-react';

export default function SubscriptionsPage() {
  const { token } = useAuthStore();
  const { addToast } = useToast();
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    const fetchSubs = async () => {
      try {
        const res = await fetch(`${API_URL}/consumer/subscriptions`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) setSubscriptions(await res.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSubs();
  }, [token]);

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    try {
      const res = await fetch(`${API_URL}/consumer/subscriptions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setSubscriptions(prev => prev.map(s => s.id === id ? { ...s, status } : s));
        addToast({ type: 'success', title: 'Updated', message: `Subscription ${status}.` });
      }
    } catch (err) {
      addToast({ type: 'error', title: 'Error', message: 'Failed to update subscription.' });
    } finally {
      setUpdating(null);
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading subscriptions...</div>;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}><RefreshCw size={24} className={styles.titleIcon} /> Annual Subscriptions</h1>
          <p className={styles.subtitle}>Manage your recurring deliveries and save up to 40% with yearly subscriptions.</p>
        </div>
      </div>

      {/* Stats */}
      <div className={styles.statsRow}>
        <Card variant="glass" padding="md" className={styles.statCard}>
          <span className={styles.statValue}>{subscriptions.filter(s => s.status === 'active').length}</span>
          <span className={styles.statLabel}>Active Plans</span>
        </Card>
        <Card variant="glass" padding="md" className={styles.statCard}>
          <span className={styles.statValue}>{formatCurrency(subscriptions.reduce((sum, s) => sum + (s.retailPricePerMonth - s.pricePerMonth), 0))}</span>
          <span className={styles.statLabel}>Monthly Savings</span>
        </Card>
        <Card variant="glass" padding="md" className={styles.statCard}>
          <span className={styles.statValue}>{subscriptions.reduce((sum, s) => sum + s.deliveriesCompleted, 0)}</span>
          <span className={styles.statLabel}>Deliveries Done</span>
        </Card>
      </div>

      {/* Subscription Cards */}
      <div className={styles.list}>
        {subscriptions.map((sub) => {
          const savings = sub.retailPricePerMonth - sub.pricePerMonth;
          const progress = Math.round((sub.deliveriesCompleted / sub.totalDeliveries) * 100);
          const nextDate = new Date(sub.nextDelivery).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

          return (
            <Card key={sub.id} variant="default" padding="lg" className={styles.subCard}>
              <div className={styles.cardHeader}>
                <div className={styles.productInfo}>
                  <Package size={20} className={styles.prodIcon} />
                  <div>
                    <h3 className={styles.productName}>{sub.product?.name}</h3>
                    <p className={styles.manufacturer}>by {sub.manufacturer?.companyName || sub.manufacturer?.name}</p>
                  </div>
                </div>
                <Badge
                  variant={sub.status === 'active' ? 'success' : sub.status === 'paused' ? 'warning' : 'default'}
                  dot
                  pulse={sub.status === 'active'}
                >
                  {getStatusLabel(sub.status)}
                </Badge>
              </div>

              <div className={styles.detailsGrid}>
                <div className={styles.detailBox}>
                  <span className={styles.detailLabel}>Monthly Qty</span>
                  <span className={styles.detailValue}>{sub.monthlyQuantity} {sub.product?.unit || 'units'}</span>
                </div>
                <div className={styles.detailBox}>
                  <span className={styles.detailLabel}>Your Price</span>
                  <span className={styles.detailValueHighlight}>{formatCurrency(sub.pricePerMonth)}/mo</span>
                </div>
                <div className={styles.detailBox}>
                  <span className={styles.detailLabel}>Retail Price</span>
                  <span className={styles.detailValue} style={{ textDecoration: 'line-through' }}>{formatCurrency(sub.retailPricePerMonth)}/mo</span>
                </div>
                <div className={styles.detailBox}>
                  <span className={styles.detailLabel}>You Save</span>
                  <span className={styles.detailValueSuccess}>{formatCurrency(savings)}/mo</span>
                </div>
              </div>

              <div className={styles.progressRow}>
                <div className={styles.progressTrack}>
                  <div className={styles.progressFill} style={{ width: `${progress}%` }} />
                </div>
                <span className={styles.progressLabel}>{sub.deliveriesCompleted}/{sub.totalDeliveries} deliveries</span>
              </div>

              <div className={styles.cardFooter}>
                <div className={styles.nextDelivery}>
                  <Truck size={14} />
                  <span>Next delivery: <strong>{nextDate}</strong></span>
                </div>
                <div className={styles.actions}>
                  {sub.status === 'active' && (
                    <Button size="sm" variant="outline" icon={<Pause size={14} />} loading={updating === sub.id} onClick={() => updateStatus(sub.id, 'paused')}>
                      Pause
                    </Button>
                  )}
                  {sub.status === 'paused' && (
                    <Button size="sm" variant="primary" icon={<Play size={14} />} loading={updating === sub.id} onClick={() => updateStatus(sub.id, 'active')}>
                      Resume
                    </Button>
                  )}
                  {sub.status !== 'cancelled' && (
                    <Button size="sm" variant="ghost" icon={<X size={14} />} loading={updating === sub.id} onClick={() => updateStatus(sub.id, 'cancelled')}>
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {subscriptions.length === 0 && (
        <Card padding="lg" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <RefreshCw size={48} style={{ margin: '0 auto 1rem', color: 'var(--primary)' }} />
          <h2 style={{ fontSize: '18px', fontWeight: '500', marginBottom: '0.5rem' }}>No active subscriptions</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Subscribe to products for annual delivery at group-purchase prices!</p>
        </Card>
      )}
    </div>
  );
}

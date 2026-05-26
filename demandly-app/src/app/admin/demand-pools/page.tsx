'use client';

import React, { useState, useEffect } from 'react';
import styles from './pools.module.css';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/components/ui/Toast';
import { formatCurrency, getStatusLabel } from '@/lib/utils';
import { API_URL } from '@/lib/api';
import { Layers, Play, Square, MapPin } from 'lucide-react';

export default function AdminDemandPoolsPage() {
  const { token } = useAuthStore();
  const { addToast } = useToast();
  const [pools, setPools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    const fetchPools = async () => {
      try {
        const res = await fetch(`${API_URL}/admin/demand-pools`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) setPools(await res.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPools();
  }, [token]);

  const updateStatus = async (poolId: string, status: string) => {
    setUpdating(poolId);
    try {
      const res = await fetch(`${API_URL}/admin/demand-pools/${poolId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setPools(prev => prev.map(p => p.id === poolId ? { ...p, status } : p));
        addToast({ type: 'success', title: 'Updated', message: `Pool status changed to ${getStatusLabel(status)}` });
      }
    } catch (err) {
      addToast({ type: 'error', title: 'Error', message: 'Failed to update pool.' });
    } finally {
      setUpdating(null);
    }
  };

  const filtered = filter === 'All' ? pools : pools.filter(p => p.status === filter);

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading demand pools...</div>;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}><Layers size={24} /> Demand Pools Management</h1>
        <p className={styles.subtitle}>Oversee demand aggregation, start auctions, and manage pool lifecycle.</p>
      </div>

      <div className={styles.filters}>
        {['All', 'aggregating', 'threshold_met', 'auction_active', 'closed', 'fulfilled'].map(s => (
          <button key={s} className={`${styles.filterBtn} ${filter === s ? styles.filterActive : ''}`} onClick={() => setFilter(s)}>
            {s === 'All' ? `All (${pools.length})` : `${getStatusLabel(s)} (${pools.filter(p => p.status === s).length})`}
          </button>
        ))}
      </div>

      <div className={styles.list}>
        {filtered.map(pool => {
          const progress = Math.round((pool.totalDemand / pool.threshold) * 100);
          return (
            <Card key={pool.id} variant="default" padding="md" className={styles.poolCard}>
              <div className={styles.cardTop}>
                <div className={styles.poolInfo}>
                  <h3 className={styles.poolName}>{pool.product?.name}</h3>
                  <div className={styles.poolMeta}>
                    <span><MapPin size={12} /> {pool.geography} ({pool.pincode})</span>
                    <span>{pool.bids?.length || pool.bidsCount || 0} bids</span>
                  </div>
                </div>
                <Badge
                  variant={pool.status === 'auction_active' ? 'accent' : pool.status === 'threshold_met' ? 'warning' : pool.status === 'fulfilled' ? 'success' : 'default'}
                  dot pulse={pool.status === 'auction_active'}
                >
                  {getStatusLabel(pool.status)}
                </Badge>
              </div>

              <div className={styles.statsRow}>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>Demand</span>
                  <span className={styles.statValue}>{pool.totalDemand}/{pool.threshold}</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>Avg Max Price</span>
                  <span className={styles.statValue}>{formatCurrency(pool.averageMaxPrice)}</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>Best Bid</span>
                  <span className={styles.statValue}>{pool.bestBidPrice ? formatCurrency(pool.bestBidPrice) : '—'}</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>Progress</span>
                  <span className={styles.statValue}>{progress}%</span>
                </div>
              </div>

              <div className={styles.cardActions}>
                {pool.status === 'threshold_met' && (
                  <Button size="sm" variant="accent" icon={<Play size={14} />} loading={updating === pool.id} onClick={() => updateStatus(pool.id, 'auction_active')}>
                    Start Auction
                  </Button>
                )}
                {pool.status === 'auction_active' && (
                  <Button size="sm" variant="outline" icon={<Square size={14} />} loading={updating === pool.id} onClick={() => updateStatus(pool.id, 'closed')}>
                    Close Auction
                  </Button>
                )}
                {pool.status === 'closed' && (
                  <Button size="sm" variant="primary" loading={updating === pool.id} onClick={() => updateStatus(pool.id, 'fulfilled')}>
                    Mark Fulfilled
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>No demand pools found for this filter.</p>
      )}
    </div>
  );
}

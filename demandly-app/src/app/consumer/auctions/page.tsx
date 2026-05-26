'use client';

import React, { useState, useEffect } from 'react';
import styles from './auctions.module.css';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import CountdownTimer from '@/components/ui/CountdownTimer';
import ProgressRing from '@/components/ui/ProgressRing';
import { useAuthStore } from '@/stores/authStore';
import { formatCurrency, getStatusLabel } from '@/lib/utils';
import { API_URL } from '@/lib/api';
import { Gavel, MapPin, Package, TrendingDown, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function AuctionsPage() {
  const { token } = useAuthStore();
  const [pools, setPools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPools = async () => {
      try {
        const res = await fetch(`${API_URL}/consumer/demand-pools/active`);
        if (res.ok) setPools(await res.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPools();
  }, []);

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading auctions...</div>;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}><Gavel size={28} className={styles.titleIcon} /> Live Auctions</h1>
          <p className={styles.subtitle}>Watch manufacturers compete to fulfil demand pools — lowest bid wins!</p>
        </div>
      </div>

      <div className={styles.grid}>
        {pools.map((pool) => {
          const progress = Math.round((pool.totalDemand / pool.threshold) * 100);
          return (
            <Card key={pool.id} variant="default" padding="lg" className={styles.poolCard}>
              <div className={styles.cardHeader}>
                <div>
                  <Badge variant="accent" dot pulse size="sm">LIVE AUCTION</Badge>
                  <h3 className={styles.productName}>{pool.product?.name}</h3>
                  <p className={styles.productCategory}>{pool.product?.category}</p>
                </div>
                <CountdownTimer deadline={pool.deadline} />
              </div>

              <div className={styles.statsGrid}>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>Total Demand</span>
                  <span className={styles.statValue}>{pool.totalDemand} <span className={styles.unit}>{pool.product?.unit || 'units'}</span></span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>Best Bid</span>
                  <span className={styles.statValueHighlight}>{pool.bestBidPrice ? formatCurrency(pool.bestBidPrice) : 'No bids'}</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>Avg Max Price</span>
                  <span className={styles.statValue}>{formatCurrency(pool.averageMaxPrice)}</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>Bids</span>
                  <span className={styles.statValue}>{pool.bidsCount}</span>
                </div>
              </div>

              <div className={styles.locationRow}>
                <MapPin size={14} />
                <span>{pool.geography} ({pool.pincode})</span>
              </div>

              {pool.bestBidPrice && pool.product?.retailPrice && (
                <div className={styles.savingsBar}>
                  <TrendingDown size={14} />
                  <span>Potential savings: <strong>{Math.round(((pool.product.retailPrice - pool.bestBidPrice) / pool.product.retailPrice) * 100)}%</strong> vs retail</span>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {pools.length === 0 && (
        <Card padding="lg" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <Gavel size={48} style={{ margin: '0 auto 1rem', color: 'var(--primary)' }} />
          <h2 style={{ fontSize: '18px', fontWeight: '500', marginBottom: '0.5rem' }}>No active auctions right now</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Register interest in products to trigger new demand pools and auctions!</p>
        </Card>
      )}
    </div>
  );
}

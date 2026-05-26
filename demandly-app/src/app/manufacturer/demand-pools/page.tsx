'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import styles from './pools.module.css';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import ProgressRing from '@/components/ui/ProgressRing';
import CountdownTimer from '@/components/ui/CountdownTimer';
import { useAuthStore } from '@/stores/authStore';
import { formatCurrency, getStatusLabel } from '@/lib/utils';
import { API_URL } from '@/lib/api';
import { Factory, MapPin, ExternalLink, ArrowUpDown, Filter } from 'lucide-react';

const statusFilters = ['All', 'auction_active', 'aggregating', 'threshold_met'];

export default function DemandPoolsPage() {
  const { token } = useAuthStore();
  const [filter, setFilter] = useState('All');
  const [sort, setSort] = useState<'demandDesc' | 'deadlineAsc'>('demandDesc');
  const [pools, setPools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    if (!token) { setLoading(false); return; }
    const fetchPools = async () => {
      try {
        const res = await fetch(`${API_URL}/manufacturer/demand-pools`, {
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

  const filteredPools = pools
    .filter((p) => filter === 'All' || p.status === filter)
    .sort((a, b) => {
      if (sort === 'demandDesc') return b.totalDemand - a.totalDemand;
      if (sort === 'deadlineAsc') return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      return 0;
    });

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading demand pools...</div>;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Demand Pools</h1>
          <p className={styles.subtitle}>Browse aggregated consumer demand and place bids</p>
        </div>
      </div>

      <div className={styles.filtersRow}>
        <div className={styles.filters}>
          {statusFilters.map((s) => (
            <button
              key={s}
              className={`${styles.filterBtn} ${filter === s ? styles.filterActive : ''}`}
              onClick={() => setFilter(s)}
            >
              {s === 'All' ? 'All Pools' : getStatusLabel(s)}
            </button>
          ))}
        </div>
        <div className={styles.sortToggle}>
          <button
            className={`${styles.sortBtn} ${sort === 'demandDesc' ? styles.sortActive : ''}`}
            onClick={() => setSort('demandDesc')}
          >
            Highest Demand
          </button>
          <button
            className={`${styles.sortBtn} ${sort === 'deadlineAsc' ? styles.sortActive : ''}`}
            onClick={() => setSort('deadlineAsc')}
          >
            Ending Soon
          </button>
        </div>
      </div>

      <div className={styles.grid}>
        {filteredPools.map((pool) => {
          const progress = Math.round((pool.totalDemand / pool.threshold) * 100);
          return (
            <Card key={pool.id} variant="default" padding="md" className={styles.poolCard}>
              <div className={styles.cardHeader}>
                <div>
                  <h3 className={styles.productName}>{pool.product.name}</h3>
                  <p className={styles.productMeta}>{pool.product.category}</p>
                </div>
                <Badge
                  variant={
                    pool.status === 'auction_active' ? 'accent' :
                    pool.status === 'threshold_met' ? 'warning' : 'default'
                  }
                  dot
                  pulse={pool.status === 'auction_active'}
                >
                  {getStatusLabel(pool.status)}
                </Badge>
              </div>

              <div className={styles.geo}>
                <MapPin size={14} className={styles.geoIcon} />
                <span>{pool.geography} (PIN: {pool.pincode})</span>
              </div>

              <div className={styles.statsGrid}>
                <div className={styles.statBox}>
                  <span className={styles.statLabel}>Total Demand</span>
                  <span className={styles.statValue}>{pool.totalDemand} <span className={styles.statUnit}>{pool.product.unit}s</span></span>
                </div>
                <div className={styles.statBox}>
                  <span className={styles.statLabel}>Avg Max Price</span>
                  <span className={styles.statValue}>{formatCurrency(pool.averageMaxPrice)}</span>
                </div>
                <div className={styles.statBox}>
                  <span className={styles.statLabel}>Current Best Bid</span>
                  <span className={styles.statValueHighlight}>
                    {pool.bestBidPrice ? formatCurrency(pool.bestBidPrice) : '—'}
                  </span>
                </div>
                <div className={styles.statBox}>
                  <span className={styles.statLabel}>Total Bids</span>
                  <span className={styles.statValue}>{pool.bidsCount}</span>
                </div>
              </div>

              <div className={styles.progressSection}>
                <div className={styles.progressHeader}>
                  <span className={styles.progressLabel}>Threshold Progress</span>
                  <span className={styles.progressValue}>{pool.totalDemand}/{pool.threshold}</span>
                </div>
                <div className={styles.progressTrack}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
              </div>

              <div className={styles.cardFooter}>
                <CountdownTimer deadline={pool.deadline} variant="compact" />
                <Link href={`/manufacturer/bid/${pool.id}`} className={styles.actionLink}>
                  <Button
                    size="sm"
                    variant={pool.status === 'auction_active' ? 'primary' : 'outline'}
                    iconRight={<ExternalLink size={14} />}
                  >
                    {pool.status === 'auction_active' ? 'Place Bid' : 'View Details'}
                  </Button>
                </Link>
              </div>
            </Card>
          );
        })}
      </div>

      {filteredPools.length === 0 && (
        <div className={styles.empty}>
          <Factory size={48} />
          <h3>No demand pools found</h3>
          <p>Try adjusting your filters</p>
        </div>
      )}
    </div>
  );
}

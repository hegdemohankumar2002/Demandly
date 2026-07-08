'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import styles from './bids.module.css';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { formatCurrency, getStatusLabel, getRelativeTime } from '@/lib/utils';
import { API_URL } from '@/lib/api';
import { FileText, MapPin, ExternalLink, Filter } from 'lucide-react';

const statusFilters = ['All', 'pending', 'won', 'lost'];

interface Bid {
  id: string;
  demandPoolId: string;
  status: string;
  pricePerUnit: number;
  deliveryTimeline: string;
  submittedAt: string;
  demandPool: {
    product: { name: string };
    geography: string;
    totalDemand: number;
    bestBidPrice?: number;
  };
}

export default function MyBidsPage() {
  const { token } = useAuthStore();
  const [filter, setFilter] = useState('All');
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    let cancelled = false;
    const fetchBids = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${API_URL}/manufacturer/bids`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok && !cancelled) setBids(await res.json());
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchBids();
    return () => { cancelled = true; };
  }, [token]);
  
  const filteredBids = filter === 'All'
    ? bids
    : bids.filter((b) => b.status === filter);

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading bids...</div>;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>My Bids</h1>
          <p className={styles.subtitle}>Track your active bids and past auction results</p>
        </div>
      </div>

      <div className={styles.filters}>
        {statusFilters.map((s) => (
          <button
            key={s}
            className={`${styles.filterBtn} ${filter === s ? styles.filterActive : ''}`}
            onClick={() => setFilter(s)}
          >
            {s === 'All' ? 'All Bids' : getStatusLabel(s)}
          </button>
        ))}
      </div>

      <div className={styles.list}>
        {filteredBids.map((bid) => (
          <Card key={bid.id} variant="default" padding="md" className={styles.bidCard}>
            <div className={styles.cardTop}>
              <div className={styles.titleArea}>
                <h3 className={styles.productName}>{bid.demandPool.product.name}</h3>
                <div className={styles.geo}>
                  <MapPin size={12} className={styles.geoIcon} />
                  <span>{bid.demandPool.geography}</span>
                </div>
              </div>
              <Badge
                variant={
                  bid.status === 'leading' ? 'secondary' :
                  bid.status === 'outbid' ? 'danger' :
                  bid.status === 'won' ? 'success' :
                  bid.status === 'lost' ? 'default' : 'primary'
                }
                dot={bid.status === 'leading' || bid.status === 'outbid'}
                pulse={bid.status === 'leading' || bid.status === 'outbid'}
              >
                {getStatusLabel(bid.status)}
              </Badge>
            </div>

            <div className={styles.detailsGrid}>
              <div className={styles.detailBox}>
                <span className={styles.detailLabel}>My Bid Price</span>
                <span className={styles.detailValueHighlight}>{formatCurrency(bid.pricePerUnit)}</span>
              </div>
              <div className={styles.detailBox}>
                <span className={styles.detailLabel}>Demand Pool Qty</span>
                <span className={styles.detailValue}>{bid.demandPool.totalDemand} units</span>
              </div>
              <div className={styles.detailBox}>
                <span className={styles.detailLabel}>Delivery Timeline</span>
                <span className={styles.detailValue}>{bid.deliveryTimeline}</span>
              </div>
              <div className={styles.detailBox}>
                <span className={styles.detailLabel}>Current Best Bid</span>
                <span className={styles.detailValue} style={{ color: bid.status === 'outbid' ? 'var(--danger)' : 'var(--text-primary)' }}>
                  {bid.demandPool.bestBidPrice ? formatCurrency(bid.demandPool.bestBidPrice) : '—'}
                </span>
              </div>
            </div>

            <div className={styles.cardBottom}>
              <span className={styles.timestamp}>Submitted {getRelativeTime(bid.submittedAt)}</span>
              <div className={styles.actions}>
                {bid.status === 'outbid' && (
                  <Link href={`/manufacturer/bid/${bid.demandPoolId}`}>
                    <Button size="sm" variant="accent">Revise Bid</Button>
                  </Link>
                )}
                {bid.status === 'won' && (
                  <Link href={`/manufacturer/fulfilment`}>
                    <Button size="sm" variant="primary">Process Order</Button>
                  </Link>
                )}
                {(bid.status === 'leading' || bid.status === 'submitted') && (
                  <Link href={`/manufacturer/bid/${bid.demandPoolId}`}>
                    <Button size="sm" variant="outline" iconRight={<ExternalLink size={14} />}>View Pool</Button>
                  </Link>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredBids.length === 0 && (
        <div className={styles.empty}>
          <FileText size={48} />
          <h3>No bids found</h3>
          <p>You haven&apos;t placed any bids matching this filter.</p>
          <Link href="/manufacturer/demand-pools">
            <Button>Browse Demand Pools</Button>
          </Link>
        </div>
      )}
    </div>
  );
}

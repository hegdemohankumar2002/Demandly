'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import styles from './interests.module.css';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import ProgressRing from '@/components/ui/ProgressRing';
import { useAuthStore } from '@/stores/authStore';
import { formatCurrency, getStatusLabel } from '@/lib/utils';
import { API_URL } from '@/lib/api';
import { Heart, Package, ExternalLink, X, Filter } from 'lucide-react';

const statusFilters = ['All', 'pending', 'threshold_met', 'auction_active', 'fulfilled', 'cancelled'];

export default function InterestsPage() {
  const { token } = useAuthStore();
  const [filter, setFilter] = useState('All');
  const [fetchedInterests, setFetchedInterests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    const fetchInterests = async () => {
      try {
        const res = await fetch(`${API_URL}/consumer/interests`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) setFetchedInterests(await res.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchInterests();
  }, [token]);

  const interests = filter === 'All'
    ? fetchedInterests
    : fetchedInterests.filter((i) => i.status === filter);

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading interests...</div>;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>My Interests</h1>
          <p className={styles.subtitle}>Track all the products you&apos;ve registered demand for</p>
        </div>
        <Link href="/consumer/products">
          <Button icon={<Heart size={16} />}>Add More</Button>
        </Link>
      </div>

      <div className={styles.filters}>
        {statusFilters.map((s) => (
          <button
            key={s}
            className={`${styles.filterBtn} ${filter === s ? styles.filterActive : ''}`}
            onClick={() => setFilter(s)}
          >
            {s === 'All' ? 'All' : getStatusLabel(s)}
          </button>
        ))}
      </div>

      <div className={styles.list}>
        {interests.map((interest) => {
          const demandPercent = Math.round(
            (interest.product.demandCount / interest.product.demandThreshold) * 100
          );
          return (
            <Card key={interest.id} variant="default" padding="none" className={styles.interestCard}>
              <div className={styles.cardLeft}>
                <div className={styles.productThumb}>
                  <Package size={24} />
                </div>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.cardTop}>
                  <div>
                    <h3 className={styles.productName}>{interest.product.name}</h3>
                    <p className={styles.productMeta}>
                      {interest.product.category} · {interest.product.unit}
                    </p>
                  </div>
                  <Badge
                    variant={
                      interest.status === 'auction_active' ? 'accent' :
                      interest.status === 'fulfilled' ? 'success' :
                      interest.status === 'threshold_met' ? 'warning' :
                      interest.status === 'cancelled' ? 'danger' : 'default'
                    }
                    dot
                    pulse={interest.status === 'auction_active'}
                  >
                    {getStatusLabel(interest.status)}
                  </Badge>
                </div>

                <div className={styles.detailsRow}>
                  <div className={styles.detail}>
                    <span className={styles.detailLabel}>Quantity</span>
                    <span className={styles.detailValue}>{interest.quantity}</span>
                  </div>
                  <div className={styles.detail}>
                    <span className={styles.detailLabel}>Max Price</span>
                    <span className={styles.detailValue}>{formatCurrency(interest.maxPrice)}</span>
                  </div>
                  <div className={styles.detail}>
                    <span className={styles.detailLabel}>Timeline</span>
                    <span className={styles.detailValue}>{interest.timeline}</span>
                  </div>
                  <div className={styles.detail}>
                    <span className={styles.detailLabel}>Demand</span>
                    <span className={styles.detailValue}>
                      {interest.product.demandCount}/{interest.product.demandThreshold}
                    </span>
                  </div>
                </div>

                <div className={styles.cardBottom}>
                  <div className={styles.demandProgress}>
                    <div className={styles.demandTrack}>
                      <div
                        className={styles.demandFill}
                        style={{ width: `${Math.min(demandPercent, 100)}%` }}
                      />
                    </div>
                    <span className={styles.demandPercent}>{demandPercent}%</span>
                  </div>
                  <div className={styles.cardActions}>
                    {interest.status === 'auction_active' && (
                      <Link href={`/consumer/auctions/${interest.productId}`}>
                        <Button size="sm" variant="accent" icon={<ExternalLink size={14} />}>
                          View Auction
                        </Button>
                      </Link>
                    )}
                    {interest.status === 'pending' && (
                      <Button size="sm" variant="ghost" icon={<X size={14} />}>
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {interests.length === 0 && (
        <div className={styles.empty}>
          <Heart size={48} />
          <h3>No interests found</h3>
          <p>Start by browsing products and clicking &quot;I Want This&quot;</p>
          <Link href="/consumer/products">
            <Button>Browse Products</Button>
          </Link>
        </div>
      )}
    </div>
  );
}

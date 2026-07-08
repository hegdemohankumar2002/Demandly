'use client';

import React from 'react';
import Link from 'next/link';
import styles from './dashboard.module.css';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { formatCurrency, getStatusLabel } from '@/lib/utils';
import { API_URL } from '@/lib/api';
import {
  Factory, TrendingUp, FileText, CheckCircle,
  Package, ArrowRight, Bell, Clock,
} from 'lucide-react';

interface ManufacturerStats {
  totalRevenue: number;
  activeBids: number;
  bidWinRate: number;
  pendingOrders: number;
  demandPoolsAvailable: number;
}

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

interface DemandPool {
  id: string;
  product: {
    id: string;
    name: string;
    category: string;
    unit: string;
  };
  geography: string;
  pincode: string;
  status: string;
  totalDemand: number;
  threshold: number;
  averageMaxPrice: number;
  bestBidPrice?: number;
  bidsCount: number;
  deadline: string;
}

export default function ManufacturerDashboard() {
  const { user, token } = useAuthStore();
  const { notifications } = useNotificationStore();
  // const unreadNotifs = notifications.filter((n) => !n.read);

  const [stats, setStats] = React.useState<ManufacturerStats | null>(null);
  const [recentBids, setRecentBids] = React.useState<Bid[]>([]);
  const [activePools, setActivePools] = React.useState<DemandPool[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      if (!token) {
        if (!cancelled) setLoading(false);
        return;
      }
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [statsRes, bidsRes, poolsRes] = await Promise.all([
          fetch(`${API_URL}/manufacturer/stats`, { headers }),
          fetch(`${API_URL}/manufacturer/bids`, { headers }),
          fetch(`${API_URL}/manufacturer/demand-pools/active`, { headers }),
        ]);
        if (statsRes.ok && !cancelled) setStats(await statsRes.json());
        if (bidsRes.ok && !cancelled) setRecentBids(await bidsRes.json());
        if (poolsRes.ok && !cancelled) setActivePools(await poolsRes.json());
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, [token]);

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading dashboard...</div>;
  }

  // Fallbacks if stats fail to load
  const manufacturerStats = stats || { totalRevenue: 0, activeBids: 0, bidWinRate: 0, pendingOrders: 0, demandPoolsAvailable: 0 };
  const mockBids = recentBids;
  const mockDemandPools = activePools;

  return (
    <div className={styles.page}>
      {/* Welcome Banner */}
      <section className={styles.welcome}>
        <div>
          <h1 className={styles.welcomeTitle}>
            Welcome back, {user?.name?.split(' ')[0] || 'Manufacturer'}
          </h1>
          <p className={styles.welcomeDesc}>
            You have <span className={styles.highlight}>{manufacturerStats.demandPoolsAvailable} new demand pools</span> available for bidding.
          </p>
        </div>
        <Link href="/manufacturer/demand-pools">
          <Button icon={<Factory size={16} />}>Browse Demand Pools</Button>
        </Link>
      </section>

      {/* Stats Grid */}
      <section className={styles.statsGrid}>
        <Card variant="glass" padding="md" className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'hsla(142, 71%, 45%, 0.12)' }}>
            <TrendingUp size={22} style={{ color: 'var(--success)' }} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{formatCurrency(manufacturerStats.totalRevenue)}</span>
            <span className={styles.statLabel}>Total Revenue</span>
          </div>
        </Card>
        <Card variant="glass" padding="md" className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'hsla(252, 85%, 60%, 0.12)' }}>
            <FileText size={22} style={{ color: 'var(--primary)' }} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{manufacturerStats.activeBids}</span>
            <span className={styles.statLabel}>Active Bids</span>
          </div>
        </Card>
        <Card variant="glass" padding="md" className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'hsla(36, 100%, 60%, 0.12)' }}>
            <CheckCircle size={22} style={{ color: 'var(--accent)' }} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{manufacturerStats.bidWinRate}%</span>
            <span className={styles.statLabel}>Bid Win Rate</span>
          </div>
        </Card>
        <Card variant="glass" padding="md" className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'hsla(168, 76%, 46%, 0.12)' }}>
            <Package size={22} style={{ color: 'var(--secondary)' }} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{manufacturerStats.pendingOrders}</span>
            <span className={styles.statLabel}>Pending Orders</span>
          </div>
        </Card>
      </section>

      <div className={styles.grid}>
        {/* Active Bids */}
        <Card variant="default" padding="none" className={styles.gridCard}>
          <CardHeader className={styles.cardHeaderPadded}>
            <div className={styles.cardHeaderRow}>
              <CardTitle>My Recent Bids</CardTitle>
              <Link href="/manufacturer/my-bids">
                <Button variant="ghost" size="sm" iconRight={<ArrowRight size={14} />}>View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className={styles.bidList}>
              {mockBids.slice(0, 3).map((bid) => (
                <div key={bid.id} className={styles.bidItem}>
                  <div className={styles.bidLeft}>
                    <div>
                      <p className={styles.bidProductName}>{bid.demandPool.product.name}</p>
                      <p className={styles.bidMeta}>
                        Bid: {formatCurrency(bid.pricePerUnit)} · Pool: {bid.demandPool.totalDemand} units
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      bid.status === 'leading' ? 'secondary' :
                      bid.status === 'outbid' ? 'danger' :
                      bid.status === 'won' ? 'success' : 'default'
                    }
                    size="sm"
                  >
                    {getStatusLabel(bid.status)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Demand Pools Available */}
        <Card variant="default" padding="none" className={styles.gridCard}>
          <CardHeader className={styles.cardHeaderPadded}>
            <div className={styles.cardHeaderRow}>
              <CardTitle>Active Demand Pools</CardTitle>
              <Link href="/manufacturer/demand-pools">
                <Button variant="ghost" size="sm" iconRight={<ArrowRight size={14} />}>View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className={styles.poolList}>
              {mockDemandPools
                .filter((dp) => dp.status === 'auction_active')
                .slice(0, 3)
                .map((pool) => (
                  <div key={pool.id} className={styles.poolItem}>
                    <div className={styles.poolTop}>
                      <h4 className={styles.poolName}>{pool.product.name}</h4>
                      <Badge variant="accent" size="sm" dot pulse>LIVE</Badge>
                    </div>
                    <div className={styles.poolDetails}>
                      <div className={styles.poolDetail}>
                        <span className={styles.poolDetailLabel}>Total Demand</span>
                        <span className={styles.poolDetailValue}>{pool.totalDemand} units</span>
                      </div>
                      <div className={styles.poolDetail}>
                        <span className={styles.poolDetailLabel}>Current Best Bid</span>
                        <span className={styles.poolDetailValue} style={{ color: 'var(--secondary)' }}>
                          {pool.bestBidPrice ? formatCurrency(pool.bestBidPrice) : 'No bids yet'}
                        </span>
                      </div>
                    </div>
                    <div className={styles.poolBottom}>
                      <span className={styles.poolGeo}>{pool.geography}</span>
                      <Link href={`/manufacturer/bid/${pool.id}`}>
                        <Button size="sm" variant="outline">Place Bid</Button>
                      </Link>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import Link from 'next/link';
import styles from './dashboard.module.css';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { formatCurrency, formatNumber, getStatusLabel } from '@/lib/utils';
import { API_URL } from '@/lib/api';
import {
  Shield, TrendingUp, Users, Factory,
  CheckCircle, ArrowRight, ShieldAlert,
} from 'lucide-react';

export default function AdminDashboard() {
  const { user, token } = useAuthStore();
  
  const [stats, setStats] = React.useState<any>({ commissionEarned: 0, activeConsumers: 0, verifiedManufacturers: 0, pendingVerifications: 0 });
  const [verifications, setVerifications] = React.useState<any[]>([]);
  const [auctions, setAuctions] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!token) return;
    const fetchData = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [statsRes, verifRes, auctRes] = await Promise.all([
          fetch(`${API_URL}/admin/stats`, { headers }),
          fetch(`${API_URL}/admin/verifications/pending`, { headers }),
          fetch(`${API_URL}/consumer/demand-pools/active`)
        ]);
        if (statsRes.ok) setStats(await statsRes.json());
        if (verifRes.ok) setVerifications(await verifRes.json());
        if (auctRes.ok) setAuctions(await auctRes.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading dashboard...</div>;

  return (
    <div className={styles.page}>
      {/* Welcome Banner */}
      <section className={styles.welcome}>
        <div>
          <h1 className={styles.welcomeTitle}>
            Platform Command Center
          </h1>
          <p className={styles.welcomeDesc}>
            Logged in as <span className={styles.highlight}>{user?.name}</span>. Oversee platform health and resolve pending approvals.
          </p>
        </div>
        <div className={styles.welcomeActions}>
          <Button icon={<ShieldAlert size={16} />} variant="accent">Review Approvals</Button>
        </div>
      </section>

      {/* Stats Grid */}
      <section className={styles.statsGrid}>
        <Card variant="glass" padding="md" className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'hsla(142, 60%, 40%, 0.12)' }}>
            <TrendingUp size={22} style={{ color: 'var(--success)' }} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{formatCurrency(stats.commissionEarned)}</span>
            <span className={styles.statLabel}>Total Commission</span>
          </div>
        </Card>
        <Card variant="glass" padding="md" className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'hsla(211, 16%, 51%, 0.12)' }}>
            <Users size={22} style={{ color: 'var(--primary)' }} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{formatNumber(stats.activeConsumers)}</span>
            <span className={styles.statLabel}>Active Consumers</span>
          </div>
        </Card>
        <Card variant="glass" padding="md" className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'hsla(0, 0%, 29%, 0.12)' }}>
            <Factory size={22} style={{ color: 'var(--secondary)' }} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{formatNumber(stats.verifiedManufacturers)}</span>
            <span className={styles.statLabel}>Verified Sellers</span>
          </div>
        </Card>
        <Card variant="glass" padding="md" className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'hsla(0, 60%, 50%, 0.12)' }}>
            <Shield size={22} style={{ color: 'var(--danger)' }} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{stats.pendingVerifications}</span>
            <span className={styles.statLabel}>Pending Verification</span>
          </div>
        </Card>
      </section>

      <div className={styles.grid}>
        {/* Pending Verifications */}
        <Card variant="default" padding="none" className={styles.gridCard}>
          <CardHeader className={styles.cardHeaderPadded}>
            <div className={styles.cardHeaderRow}>
              <CardTitle>Manufacturer Queue</CardTitle>
              <Button variant="ghost" size="sm" iconRight={<ArrowRight size={14} />}>View All</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className={styles.list}>
              {verifications.map((item) => (
                <div key={item.id} className={styles.listItem}>
                  <div className={styles.itemLeft}>
                    <div>
                      <p className={styles.itemName}>{item.companyName}</p>
                      <p className={styles.itemMeta}>
                        {item.city} · {item.type}
                      </p>
                    </div>
                  </div>
                  <div className={styles.itemActions}>
                    <Button size="sm" variant="outline">Review</Button>
                    <Button size="sm" variant="primary" icon={<CheckCircle size={14} />}>Approve</Button>
                  </div>
                </div>
              ))}
              {verifications.length === 0 && <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>No pending verifications.</p>}
            </div>
          </CardContent>
        </Card>

        {/* Live Demand Pools Overview */}
        <Card variant="default" padding="none" className={styles.gridCard}>
          <CardHeader className={styles.cardHeaderPadded}>
            <div className={styles.cardHeaderRow}>
              <CardTitle>Live Auctions Radar</CardTitle>
              <Button variant="ghost" size="sm" iconRight={<ArrowRight size={14} />}>View Maps</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className={styles.list}>
              {auctions
                .slice(0, 3)
                .map((pool) => (
                  <div key={pool.id} className={styles.listItem}>
                    <div className={styles.itemLeft}>
                      <h4 className={styles.itemName}>{pool.product.name}</h4>
                      <div className={styles.itemMeta}>
                        <span style={{ color: 'var(--primary-dark)', fontWeight: 600 }}>{pool.totalDemand} units</span>
                        <span> · {pool.bidsCount} bids</span>
                      </div>
                    </div>
                    <Badge variant="accent" size="sm" dot pulse>LIVE</Badge>
                  </div>
                ))}
                {auctions.length === 0 && <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>No active auctions.</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

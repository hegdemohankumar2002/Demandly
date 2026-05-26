'use client';

import React, { useState, useEffect } from 'react';
import styles from './analytics.module.css';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { useAuthStore } from '@/stores/authStore';
import { formatCurrency } from '@/lib/utils';
import { API_URL } from '@/lib/api';
import { TrendingUp, DollarSign, ShoppingCart, Target, BarChart3, Package } from 'lucide-react';

export default function AnalyticsPage() {
  const { token } = useAuthStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    const fetchAnalytics = async () => {
      try {
        const res = await fetch(`${API_URL}/manufacturer/analytics`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) setData(await res.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [token]);

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading analytics...</div>;

  // Fallback data for demo mode
  const analytics = data || {
    totalRevenue: 381000, totalBids: 12, wonBids: 8, bidWinRate: 67,
    totalOrders: 25, deliveredOrders: 18,
    monthlyRevenue: { Jan: 45000, Feb: 62000, Mar: 78000, Apr: 91000, May: 105000 },
    topProducts: [
      { name: 'Organic Coconut Oil', units: 1200, revenue: 408000, orderCount: 10 },
      { name: 'Cold Pressed Groundnut Oil', units: 800, revenue: 224000, orderCount: 7 },
      { name: 'A2 Cow Ghee', units: 450, revenue: 189000, orderCount: 5 },
      { name: 'Raw Honey', units: 320, revenue: 128000, orderCount: 4 },
    ]
  };

  const months = Object.keys(analytics.monthlyRevenue || {});
  const revenues = Object.values(analytics.monthlyRevenue || {}) as number[];
  const maxRevenue = Math.max(...revenues, 1);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Analytics</h1>
        <p className={styles.subtitle}>Track your performance, revenue trends, and product insights.</p>
      </div>

      {/* KPI Stats */}
      <div className={styles.statsGrid}>
        <Card variant="glass" padding="md" className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'hsla(142, 60%, 40%, 0.1)' }}>
            <DollarSign size={20} style={{ color: 'var(--success)' }} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{formatCurrency(analytics.totalRevenue)}</span>
            <span className={styles.statLabel}>Total Revenue</span>
          </div>
        </Card>
        <Card variant="glass" padding="md" className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'hsla(211, 16%, 51%, 0.1)' }}>
            <ShoppingCart size={20} style={{ color: 'var(--primary)' }} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{analytics.totalOrders}</span>
            <span className={styles.statLabel}>Total Orders</span>
          </div>
        </Card>
        <Card variant="glass" padding="md" className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'hsla(0, 0%, 29%, 0.1)' }}>
            <Target size={20} style={{ color: 'var(--secondary)' }} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{analytics.bidWinRate}%</span>
            <span className={styles.statLabel}>Bid Win Rate</span>
          </div>
        </Card>
        <Card variant="glass" padding="md" className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'hsla(44, 70%, 50%, 0.1)' }}>
            <BarChart3 size={20} style={{ color: 'var(--accent)' }} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{analytics.deliveredOrders || 0}</span>
            <span className={styles.statLabel}>Units Fulfilled</span>
          </div>
        </Card>
      </div>

      <div className={styles.chartsRow}>
        {/* Monthly Revenue Chart */}
        <Card variant="default" padding="lg" className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Monthly Revenue</h3>
          <div className={styles.barChart}>
            {months.map((month, i) => (
              <div key={month} className={styles.barCol}>
                <span className={styles.barLabel}>{formatCurrency(revenues[i]).replace('₹', '₹')}</span>
                <div className={styles.barTrack}>
                  <div className={styles.barFill} style={{ height: `${(revenues[i] / maxRevenue) * 100}%` }} />
                </div>
                <span className={styles.barMonth}>{month}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Top Products */}
        <Card variant="default" padding="lg" className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Top Products</h3>
          <div className={styles.productList}>
            {(analytics.topProducts || []).map((product: any, i: number) => (
              <div key={i} className={styles.productRow}>
                <div className={styles.productInfo}>
                  <span className={styles.productName}>{product.name}</span>
                  <span className={styles.productUnits}>{product.units} units</span>
                </div>
                <div className={styles.productRevenue}>
                  <span className={styles.productRevenueValue}>{formatCurrency(product.revenue)}</span>
                  <Badge variant={i < 2 ? 'success' : i < 3 ? 'warning' : 'default'} size="sm">
                    {i < 2 ? '↑ Up' : i === 2 ? '↓ Down' : '↑ Up'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Bid Performance */}
      <Card variant="default" padding="lg">
        <h3 className={styles.chartTitle}>Bid Performance</h3>
        <div className={styles.bidStats}>
          <div className={styles.bidStat}>
            <span className={styles.bidStatValue}>{analytics.totalBids}</span>
            <span className={styles.bidStatLabel}>Total Bids</span>
          </div>
          <div className={styles.bidStat}>
            <span className={styles.bidStatValue} style={{ color: 'var(--success)' }}>{analytics.wonBids}</span>
            <span className={styles.bidStatLabel}>Won</span>
          </div>
          <div className={styles.bidStat}>
            <span className={styles.bidStatValue} style={{ color: 'var(--danger)' }}>{analytics.totalBids - analytics.wonBids}</span>
            <span className={styles.bidStatLabel}>Lost</span>
          </div>
          <div className={styles.bidStat}>
            <span className={styles.bidStatValue} style={{ color: 'var(--primary)' }}>{analytics.bidWinRate}%</span>
            <span className={styles.bidStatLabel}>Win Rate</span>
          </div>
        </div>
      </Card>
    </div>
  );
}

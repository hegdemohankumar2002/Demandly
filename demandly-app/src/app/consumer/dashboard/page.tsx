'use client';

import React from 'react';
import Link from 'next/link';
import styles from './dashboard.module.css';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import ProgressRing from '@/components/ui/ProgressRing';
import CountdownTimer from '@/components/ui/CountdownTimer';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { formatCurrency, getStatusLabel, getStatusColor } from '@/lib/utils';
import { API_URL } from '@/lib/api';
import {
  TrendingDown, Heart, Gavel, CreditCard,
  Package, ArrowRight, Bell, Zap, ShoppingBag,
} from 'lucide-react';

export default function ConsumerDashboard() {
  const { user, token } = useAuthStore();
  const { notifications, markAsRead } = useNotificationStore();
  const unreadNotifs = notifications.filter((n) => !n.read);

  const [stats, setStats] = React.useState<any>({ totalSaved: 0, savingsPercentage: 0, activeInterests: 0, activeAuctions: 0, activeSubscriptions: 0 });
  const [interests, setInterests] = React.useState<any[]>([]);
  const [auctions, setAuctions] = React.useState<any[]>([]);
  const [orders, setOrders] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    const fetchData = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [statsRes, intRes, auctRes, ordersRes] = await Promise.all([
          fetch(`${API_URL}/consumer/stats`, { headers }),
          fetch(`${API_URL}/consumer/interests`, { headers }),
          fetch(`${API_URL}/consumer/demand-pools/active`, { headers }),
          fetch(`${API_URL}/consumer/orders`, { headers })
        ]);
        if (statsRes.ok) setStats(await statsRes.json());
        if (intRes.ok) setInterests(await intRes.json());
        if (auctRes.ok) setAuctions(await auctRes.json());
        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          const mappedOrders = (ordersData.interests || []).map((i: any) => ({
            id: i.id,
            product: i.product,
            totalPrice: i.maxPrice * i.quantity,
            status: i.status === 'fulfilled' ? 'delivered' : 'manufacturing'
          }));
          setOrders(mappedOrders);
        }
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
            Welcome back, {user?.name?.split(' ')[0] || 'there'} 👋
          </h1>
          <p className={styles.welcomeDesc}>
            You&apos;ve saved <span className={styles.savedAmount}>{formatCurrency(stats.totalSavings || 0)}</span> so far!
            Keep demanding, keep saving.
          </p>
        </div>
        <Link href="/consumer/products">
          <Button icon={<Zap size={16} />}>I Want Something</Button>
        </Link>
      </section>

      {/* Stats Grid */}
      <section className={styles.statsGrid}>
        <Card variant="glass" padding="md" className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'hsla(168, 76%, 46%, 0.12)' }}>
            <TrendingDown size={22} style={{ color: 'var(--secondary)' }} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{stats.savingsPercentage || 0}%</span>
            <span className={styles.statLabel}>Avg. Savings</span>
          </div>
        </Card>
        <Card variant="glass" padding="md" className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'hsla(252, 85%, 60%, 0.12)' }}>
            <Heart size={22} style={{ color: 'var(--primary)' }} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{stats.activeInterests || 0}</span>
            <span className={styles.statLabel}>Active Interests</span>
          </div>
        </Card>
        <Card variant="glass" padding="md" className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'hsla(36, 100%, 60%, 0.12)' }}>
            <Gavel size={22} style={{ color: 'var(--accent)' }} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{auctions.length}</span>
            <span className={styles.statLabel}>Live Auctions</span>
          </div>
        </Card>
        <Card variant="glass" padding="md" className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'hsla(142, 71%, 45%, 0.12)' }}>
            <CreditCard size={22} style={{ color: 'var(--success)' }} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>0</span>
            <span className={styles.statLabel}>Subscriptions</span>
          </div>
        </Card>
      </section>

      <div className={styles.grid}>
        {/* Active Interests */}
        <Card variant="default" padding="none" className={styles.gridCard}>
          <CardHeader className={styles.cardHeaderPadded}>
            <div className={styles.cardHeaderRow}>
              <CardTitle>My Interests</CardTitle>
              <Link href="/consumer/interests">
                <Button variant="ghost" size="sm" iconRight={<ArrowRight size={14} />}>View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className={styles.interestList}>
              {interests.slice(0, 3).map((interest) => (
                <div key={interest.id} className={styles.interestItem}>
                  <div className={styles.interestLeft}>
                    <ProgressRing
                      current={interest.product.demandCount}
                      total={interest.product.demandThreshold}
                      size={48}
                      strokeWidth={4}
                      showLabel={false}
                      variant={interest.status === 'auction_active' ? 'accent' : 'primary'}
                    />
                    <div>
                      <p className={styles.interestName}>{interest.product.name}</p>
                      <p className={styles.interestMeta}>
                        Qty: {interest.quantity} · Max: {formatCurrency(interest.maxPrice)}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      interest.status === 'auction_active' ? 'accent' :
                      interest.status === 'fulfilled' ? 'success' :
                      interest.status === 'threshold_met' ? 'warning' : 'default'
                    }
                    size="sm"
                    dot
                    pulse={interest.status === 'auction_active'}
                  >
                    {getStatusLabel(interest.status)}
                  </Badge>
                </div>
              ))}
              {interests.length === 0 && <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>No active interests yet.</p>}
            </div>
          </CardContent>
        </Card>

        {/* Live Auctions */}
        <Card variant="default" padding="none" className={styles.gridCard}>
          <CardHeader className={styles.cardHeaderPadded}>
            <div className={styles.cardHeaderRow}>
              <CardTitle>Live Auctions</CardTitle>
              <Link href="/consumer/auctions">
                <Button variant="ghost" size="sm" iconRight={<ArrowRight size={14} />}>View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className={styles.auctionList}>
              {auctions
                .slice(0, 2)
                .map((pool) => (
                  <div key={pool.id} className={styles.auctionItem}>
                    <div className={styles.auctionTop}>
                      <h4 className={styles.auctionName}>{pool.product.name}</h4>
                      <Badge variant="accent" size="sm" dot pulse>LIVE</Badge>
                    </div>
                    <div className={styles.auctionDetails}>
                      <div className={styles.auctionDetail}>
                        <span className={styles.auctionDetailLabel}>Best Bid</span>
                        <span className={styles.auctionDetailValue} style={{ color: 'var(--secondary)' }}>
                          {pool.bestBidPrice ? formatCurrency(pool.bestBidPrice) : '—'}
                        </span>
                      </div>
                      <div className={styles.auctionDetail}>
                        <span className={styles.auctionDetailLabel}>Bids</span>
                        <span className={styles.auctionDetailValue}>{pool.bidsCount}</span>
                      </div>
                      <div className={styles.auctionDetail}>
                        <span className={styles.auctionDetailLabel}>Demand</span>
                        <span className={styles.auctionDetailValue}>{pool.totalDemand} units</span>
                      </div>
                    </div>
                    <div className={styles.auctionBottom}>
                      <CountdownTimer deadline={pool.deadline} variant="compact" />
                      <span className={styles.auctionGeo}>{pool.geography}</span>
                    </div>
                  </div>
                ))}
                {auctions.length === 0 && <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>No live auctions currently.</p>}
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card variant="default" padding="none" className={styles.gridCard}>
          <CardHeader className={styles.cardHeaderPadded}>
            <div className={styles.cardHeaderRow}>
              <CardTitle>
                <Bell size={18} style={{ display: 'inline', marginRight: '8px' }} />
                Notifications
              </CardTitle>
              {unreadNotifs.length > 0 && (
                <Badge variant="danger" size="sm">{unreadNotifs.length} new</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className={styles.notifList}>
              {notifications.slice(0, 4).map((notif) => (
                <div
                  key={notif.id}
                  className={`${styles.notifItem} ${!notif.read ? styles.notifUnread : ''}`}
                  onClick={() => markAsRead(notif.id)}
                >
                  <div className={styles.notifDot} style={{ background: !notif.read ? 'var(--primary)' : 'transparent' }} />
                  <div>
                    <p className={styles.notifTitle}>{notif.title}</p>
                    <p className={styles.notifMessage}>{notif.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card variant="default" padding="none" className={styles.gridCard}>
          <CardHeader className={styles.cardHeaderPadded}>
            <div className={styles.cardHeaderRow}>
              <CardTitle>Recent Orders</CardTitle>
              <Link href="/consumer/orders">
                <Button variant="ghost" size="sm" iconRight={<ArrowRight size={14} />}>View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className={styles.orderList}>
              {orders.map((order) => (
                <div key={order.id} className={styles.orderItem}>
                  <div className={styles.orderIcon}>
                    <Package size={18} />
                  </div>
                  <div className={styles.orderInfo}>
                    <p className={styles.orderName}>{order.product.name}</p>
                    <p className={styles.orderMeta}>
                      {formatCurrency(order.totalPrice)}
                    </p>
                  </div>
                  <Badge
                    variant={
                      order.status === 'delivered' ? 'success' :
                      order.status === 'shipped' ? 'secondary' :
                      order.status === 'manufacturing' ? 'accent' : 'primary'
                    }
                    size="sm"
                  >
                    {getStatusLabel(order.status)}
                  </Badge>
                </div>
              ))}
              {orders.length === 0 && <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>No recent orders.</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

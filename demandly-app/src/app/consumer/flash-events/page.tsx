'use client';

import React, { useState, useEffect } from 'react';
import styles from './flash.module.css';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import CountdownTimer from '@/components/ui/CountdownTimer';
import ProgressRing from '@/components/ui/ProgressRing';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/components/ui/Toast';
import { formatCurrency } from '@/lib/utils';
import { API_URL } from '@/lib/api';
import { Zap, Users, TrendingDown, Flame, Plus, Minus } from 'lucide-react';

export default function FlashEventsPage() {
  const { token } = useAuthStore();
  const { addToast } = useToast();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [joining, setJoining] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch(`${API_URL}/consumer/flash-events`);
        if (res.ok) setEvents(await res.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const handleJoin = async (eventId: string) => {
    if (!token) {
      addToast({ type: 'error', title: 'Sign In Required', message: 'Please sign in to join flash events.' });
      return;
    }
    setJoining(eventId);
    try {
      const res = await fetch(`${API_URL}/consumer/flash-events/${eventId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ quantity: quantities[eventId] || 1 })
      });
      if (res.ok) {
        const updated = await res.json();
        setEvents(prev => prev.map(e => e.id === eventId ? { ...e, currentUnits: updated.currentUnits, status: updated.status } : e));
        addToast({ type: 'success', title: 'Joined! 🎉', message: `You've joined this flash event.` });
      }
    } catch (err) {
      addToast({ type: 'error', title: 'Error', message: 'Failed to join event.' });
    } finally {
      setJoining(null);
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading flash events...</div>;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}><Flame size={28} className={styles.titleIcon} /> Flash Deals</h1>
          <p className={styles.subtitle}>Limited-time group buying events — the more people join, the lower the price!</p>
        </div>
      </div>

      <div className={styles.grid}>
        {events.map((event) => {
          const progress = Math.round((event.currentUnits / event.targetUnits) * 100);
          const tiers = typeof event.tiers === 'string' ? JSON.parse(event.tiers) : event.tiers;
          const qty = quantities[event.id] || 1;

          return (
            <Card key={event.id} variant="default" padding="lg" className={styles.eventCard}>
              <div className={styles.eventHeader}>
                <div className={styles.productInfo}>
                  <h3 className={styles.productName}>{event.product?.name || 'Product'}</h3>
                  <p className={styles.productCategory}>{event.product?.category}</p>
                </div>
                <Badge variant="accent" dot pulse>LIVE</Badge>
              </div>

              <div className={styles.priceSection}>
                <div className={styles.priceRow}>
                  <span className={styles.flashPrice}>{formatCurrency(event.pricePerUnit)}</span>
                  <span className={styles.retailPrice}>{formatCurrency(event.retailPrice)}</span>
                  <Badge variant="success" size="sm">Save {event.savingsPercent}%</Badge>
                </div>
              </div>

              <div className={styles.progressSection}>
                <div className={styles.progressInfo}>
                  <ProgressRing
                    current={event.currentUnits}
                    total={event.targetUnits}
                    size={56}
                    strokeWidth={5}
                    variant={progress >= 75 ? 'accent' : 'primary'}
                  />
                  <div className={styles.progressText}>
                    <span className={styles.progressCount}>{event.currentUnits}/{event.targetUnits} units</span>
                    <span className={styles.progressLabel}>joined so far</span>
                  </div>
                </div>
                <CountdownTimer deadline={event.endsAt} />
              </div>

              {/* Tier Pricing */}
              {tiers && tiers.length > 0 && (
                <div className={styles.tiers}>
                  {tiers.map((tier: any, i: number) => (
                    <div key={i} className={`${styles.tier} ${event.currentUnits >= tier.units ? styles.tierUnlocked : ''}`}>
                      <span className={styles.tierLabel}>{tier.label}</span>
                      <span className={styles.tierInfo}>{tier.units}+ units → {formatCurrency(tier.price)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className={styles.joinSection}>
                <div className={styles.qtyControl}>
                  <button className={styles.qtyBtn} onClick={() => setQuantities(prev => ({ ...prev, [event.id]: Math.max(1, qty - 1) }))}>
                    <Minus size={14} />
                  </button>
                  <span className={styles.qtyValue}>{qty}</span>
                  <button className={styles.qtyBtn} onClick={() => setQuantities(prev => ({ ...prev, [event.id]: qty + 1 }))}>
                    <Plus size={14} />
                  </button>
                </div>
                <Button
                  fullWidth
                  variant="accent"
                  icon={<Zap size={16} />}
                  loading={joining === event.id}
                  onClick={() => handleJoin(event.id)}
                  disabled={event.status !== 'active'}
                >
                  {event.status === 'active' ? `Join for ${formatCurrency(event.pricePerUnit * qty)}` : 'Event Completed'}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {events.length === 0 && (
        <Card padding="lg" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <Zap size={48} style={{ margin: '0 auto 1rem', color: 'var(--accent)' }} />
          <h2 style={{ fontSize: '18px', fontWeight: '500', marginBottom: '0.5rem' }}>No active flash events</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Check back soon for exclusive group buying deals!</p>
        </Card>
      )}
    </div>
  );
}

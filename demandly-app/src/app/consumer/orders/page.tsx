'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './orders.module.css';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/components/ui/Toast';
import { formatCurrency, getStatusLabel } from '@/lib/utils';
import { API_URL } from '@/lib/api';
import { loadRazorpayScript } from '@/lib/razorpay';
import { Package, ShoppingBag, Truck, CheckCircle, RefreshCw, CreditCard, MapPin, Factory, Clock, Navigation } from 'lucide-react';

const statusConfig: Record<string, { variant: 'warning' | 'secondary' | 'primary' | 'success' | 'danger' | 'default'; icon: React.ReactNode; label: string }> = {
  'pending_payment': { variant: 'warning', icon: <CreditCard size={12} />, label: 'Confirm Payment' },
  'confirmed': { variant: 'secondary', icon: <CheckCircle size={12} />, label: 'Confirmed' },
  'manufacturing': { variant: 'primary', icon: <Factory size={12} />, label: 'Manufacturing' },
  'shipped': { variant: 'primary', icon: <Truck size={12} />, label: 'Shipped' },
  'delivered': { variant: 'success', icon: <CheckCircle size={12} />, label: 'Delivered' },
};

export default function OrdersPage() {
  const { token } = useAuthStore();
  const { addToast } = useToast();
  const [data, setData] = useState<any>({ orders: [], subscriptions: [] });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'orders' | 'subscriptions'>('orders');
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);

  const fetchOrders = async () => {
    if (!token) { setLoading(false); return; }
    try {
      const res = await fetch(`${API_URL}/consumer/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setData(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [token]);

  const handleConfirmCOD = async (orderId: string) => {
    setConfirmingId(orderId);
    try {
      const res = await fetch(`${API_URL}/consumer/orders/${orderId}/confirm`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to confirm');
      addToast({ type: 'success', title: 'Order Confirmed!', message: 'Your Cash on Delivery order has been placed.' });
      fetchOrders();
    } catch (error: any) {
      addToast({ type: 'error', title: 'Error', message: error.message });
    } finally {
      setConfirmingId(null);
    }
  };

  const handlePayOnline = async (order: any) => {
    setPayingId(order.id);
    try {
      const res = await fetch(`${API_URL}/payment/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId: order.id }),
      });
      if (!res.ok) throw new Error('Failed to create payment order');
      const data = await res.json();

      const resLoaded = await loadRazorpayScript();
      if (!resLoaded) {
        addToast({ type: 'error', title: 'Error', message: 'Razorpay SDK failed to load. Are you online?' });
        return;
      }

      const options = {
        key: data.key,
        amount: data.amount,
        currency: data.currency,
        name: data.name,
        description: data.description,
        order_id: data.orderId,
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch(`${API_URL}/payment/verify`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                orderId: data.orderId,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
              }),
            });
            if (!verifyRes.ok) throw new Error('Payment verification failed');
            addToast({ type: 'success', title: 'Payment Successful!', message: 'Your order is now confirmed.' });
            fetchOrders();
          } catch (err: any) {
            addToast({ type: 'error', title: 'Payment Error', message: err.message });
          }
        },
        prefill: {
          name: 'Demandly Consumer',
          email: 'consumer@demandly.com',
        },
        theme: {
          color: '#2a3b4c',
        },
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();
    } catch (error: any) {
      addToast({ type: 'error', title: 'Error', message: error.message });
    } finally {
      setPayingId(null);
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading orders...</div>;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}><ShoppingBag size={24} /> My Orders</h1>
        <p className={styles.subtitle}>Track your orders from auction to delivery.</p>
      </div>

      <div className={styles.tabs}>
        <button className={`${styles.tab} ${tab === 'orders' ? styles.tabActive : ''}`} onClick={() => setTab('orders')}>
          <Package size={16} /> Orders ({data.orders?.length || 0})
        </button>
        <button className={`${styles.tab} ${tab === 'subscriptions' ? styles.tabActive : ''}`} onClick={() => setTab('subscriptions')}>
          <RefreshCw size={16} /> Subscriptions ({data.subscriptions?.length || 0})
        </button>
      </div>

      {tab === 'orders' && (
        <div className={styles.list}>
          {(data.orders || []).map((order: any) => {
            const config = statusConfig[order.status] || { variant: 'default' as const, icon: null, label: order.status };
            const estDate = new Date(order.estimatedDelivery).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

            return (
              <Card key={order.id} variant="default" padding="md" className={styles.card}>
                <div className={styles.cardTop}>
                  <div className={styles.info}>
                    <h3 className={styles.productName}>{order.product?.name}</h3>
                    <p className={styles.meta}>
                      {order.quantity} {order.product?.unit} · {formatCurrency(order.pricePerUnit)}/{order.product?.unit} · Total: <strong>{formatCurrency(order.totalPrice)}</strong>
                    </p>
                  </div>
                  <Badge variant={config.variant} size="sm">{config.icon} {config.label}</Badge>
                </div>

                <div className={styles.orderDetails}>
                  <div className={styles.detailItem}>
                    <Factory size={14} />
                    <span>By {order.manufacturer?.companyName || order.manufacturer?.name}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <Clock size={14} />
                    <span>Est. delivery: <strong>{estDate}</strong></span>
                  </div>
                  {order.trackingId && (
                    <div className={styles.detailItem}>
                      <MapPin size={14} />
                      <span>Tracking: <strong>{order.trackingId}</strong></span>
                    </div>
                  )}
                  <div className={styles.detailItem}>
                    <CreditCard size={14} />
                    <span>Payment: {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online'} ({order.paymentStatus})</span>
                  </div>
                </div>

                {/* Status timeline */}
                <div className={styles.timeline}>
                  {['pending_payment', 'confirmed', 'manufacturing', 'shipped', 'delivered'].map((step, i) => {
                    const stepOrder = ['pending_payment', 'confirmed', 'manufacturing', 'shipped', 'delivered'];
                    const currentIdx = stepOrder.indexOf(order.status);
                    const stepIdx = stepOrder.indexOf(step);
                    const isCompleted = stepIdx < currentIdx;
                    const isCurrent = stepIdx === currentIdx;
                    
                    return (
                      <div key={step} className={`${styles.timelineStep} ${isCompleted ? styles.completed : ''} ${isCurrent ? styles.current : ''}`}>
                        <div className={styles.timelineDot} />
                        {i < 4 && <div className={styles.timelineLine} />}
                        <span className={styles.timelineLabel}>{(statusConfig[step]?.label || step)}</span>
                      </div>
                    );
                  })}
                </div>

                {order.status === 'pending_payment' && (
                  <div className={styles.actionRow} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <Button
                      variant="primary"
                      size="sm"
                      loading={payingId === order.id}
                      onClick={() => handlePayOnline(order)}
                      icon={<CreditCard size={14} />}
                    >
                      Pay Online
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      loading={confirmingId === order.id}
                      onClick={() => handleConfirmCOD(order.id)}
                    >
                      Confirm Cash on Delivery
                    </Button>
                  </div>
                )}

                {['shipped', 'manufacturing', 'confirmed'].includes(order.status) && (
                  <div className={styles.actionRow}>
                    <Link href={`/consumer/tracking?order=${order.id}`}>
                      <Button variant="ghost" size="sm" icon={<Navigation size={14} />}>
                        Track Order
                      </Button>
                    </Link>
                  </div>
                )}
              </Card>
            );
          })}
          {(!data.orders || data.orders.length === 0) && (
            <Card padding="lg" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
              <Package size={40} style={{ margin: '0 auto 0.75rem', color: 'var(--text-tertiary)' }} />
              <h3 style={{ fontSize: '16px', fontWeight: '500', marginBottom: '0.375rem' }}>No orders yet</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Once an auction completes, your orders will appear here for confirmation.</p>
            </Card>
          )}
        </div>
      )}

      {tab === 'subscriptions' && (
        <div className={styles.list}>
          {(data.subscriptions || []).map((sub: any) => {
            const nextDate = new Date(sub.nextDelivery).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
            return (
              <Card key={sub.id} variant="default" padding="md" className={styles.card}>
                <div className={styles.cardTop}>
                  <div className={styles.info}>
                    <h3 className={styles.productName}>{sub.product?.name}</h3>
                    <p className={styles.meta}>
                      {sub.monthlyQuantity}× per month · {formatCurrency(sub.pricePerMonth)}/mo · by {sub.manufacturer?.companyName || sub.manufacturer?.name}
                    </p>
                  </div>
                  <Badge variant={sub.status === 'active' ? 'success' : sub.status === 'paused' ? 'warning' : 'default'} dot pulse={sub.status === 'active'} size="sm">
                    {getStatusLabel(sub.status)}
                  </Badge>
                </div>
                <div className={styles.deliveryRow}>
                  <Truck size={14} />
                  <span>Next delivery: <strong>{nextDate}</strong></span>
                  <span className={styles.deliveryProgress}>{sub.deliveriesCompleted}/{sub.totalDeliveries} delivered</span>
                </div>
              </Card>
            );
          })}
          {(!data.subscriptions || data.subscriptions.length === 0) && (
            <Card padding="lg" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
              <RefreshCw size={40} style={{ margin: '0 auto 0.75rem', color: 'var(--text-tertiary)' }} />
              <h3 style={{ fontSize: '16px', fontWeight: '500', marginBottom: '0.375rem' }}>No subscriptions yet</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Subscribe to products for annual delivery at group-purchase prices.</p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import styles from './orders.module.css';
import Card, { CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/components/ui/Toast';
import { formatCurrency } from '@/lib/utils';
import { API_URL } from '@/lib/api';
import { ShoppingBag, Search, Factory, User, MapPin, Truck, CreditCard } from 'lucide-react';

const statusConfig: Record<string, { variant: 'warning' | 'secondary' | 'primary' | 'success' | 'danger' | 'default'; label: string }> = {
  'pending_payment': { variant: 'warning', label: 'Pending Payment' },
  'confirmed': { variant: 'secondary', label: 'Confirmed' },
  'manufacturing': { variant: 'primary', label: 'Manufacturing' },
  'shipped': { variant: 'primary', label: 'Shipped' },
  'delivered': { variant: 'success', label: 'Delivered' },
};

export default function AdminOrdersPage() {
  const { token } = useAuthStore();
  const { addToast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/admin/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setOrders(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [token]);

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch(`${API_URL}/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error('Failed to update');
      addToast({ type: 'success', title: 'Updated', message: `Order status changed to ${newStatus}` });
      fetchOrders();
    } catch (error: any) {
      addToast({ type: 'error', title: 'Error', message: error.message });
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  const counts = {
    all: orders.length,
    pending_payment: orders.filter(o => o.status === 'pending_payment').length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    manufacturing: orders.filter(o => o.status === 'manufacturing').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}><ShoppingBag size={24} /> All Orders</h1>
        <p className={styles.subtitle}>Monitor the complete order lifecycle across the platform.</p>
      </div>

      {/* Filter tabs */}
      <div className={styles.filterRow}>
        {Object.entries(counts).map(([key, count]) => (
          <button
            key={key}
            className={`${styles.filterBtn} ${filter === key ? styles.filterActive : ''}`}
            onClick={() => setFilter(key)}
          >
            {key === 'all' ? 'All' : statusConfig[key]?.label || key} ({count})
          </button>
        ))}
      </div>

      <Card variant="default" padding="none">
        <CardContent>
          {loading ? (
            <div className={styles.empty}>Loading orders...</div>
          ) : filtered.length === 0 ? (
            <div className={styles.empty}>
              <Search size={48} />
              <h3>No Orders Found</h3>
              <p>No orders match the selected filter.</p>
            </div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Consumer</th>
                    <th>Manufacturer</th>
                    <th>Qty</th>
                    <th>Total</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(order => {
                    const config = statusConfig[order.status] || { variant: 'default' as const, label: order.status };
                    const nextStatus: Record<string, string> = {
                      'confirmed': 'manufacturing',
                      'manufacturing': 'shipped',
                      'shipped': 'delivered',
                    };

                    return (
                      <tr key={order.id}>
                        <td>
                          <div className={styles.cellStack}>
                            <span className={styles.cellPrimary}>{order.product?.name}</span>
                            <span className={styles.cellSecondary}>{order.product?.category}</span>
                          </div>
                        </td>
                        <td>
                          <div className={styles.cellStack}>
                            <span className={styles.cellPrimary}><User size={12} /> {order.consumer?.name}</span>
                            <span className={styles.cellSecondary}>{order.consumer?.city} {order.consumer?.pincode}</span>
                          </div>
                        </td>
                        <td>
                          <div className={styles.cellStack}>
                            <span className={styles.cellPrimary}><Factory size={12} /> {order.manufacturer?.companyName || order.manufacturer?.name}</span>
                          </div>
                        </td>
                        <td>{order.quantity}</td>
                        <td className={styles.priceCell}>{formatCurrency(order.totalPrice)}</td>
                        <td>
                          <Badge variant={order.paymentStatus === 'paid' ? 'success' : 'warning'} size="sm">
                            <CreditCard size={10} /> {order.paymentStatus}
                          </Badge>
                        </td>
                        <td><Badge variant={config.variant} size="sm">{config.label}</Badge></td>
                        <td>
                          {nextStatus[order.status] && (
                            <Button
                              variant="outline"
                              size="sm"
                              loading={updatingId === order.id}
                              onClick={() => handleStatusUpdate(order.id, nextStatus[order.status])}
                            >
                              → {statusConfig[nextStatus[order.status]]?.label}
                            </Button>
                          )}
                          {order.status === 'delivered' && (
                            <span className={styles.completedText}>✓ Complete</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

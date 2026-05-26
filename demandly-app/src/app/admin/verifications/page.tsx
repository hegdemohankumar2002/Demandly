'use client';

import React, { useState, useEffect } from 'react';
import styles from './verifications.module.css';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/components/ui/Toast';
import { API_URL } from '@/lib/api';
import { Shield, CheckCircle, XCircle, Building2, MapPin, Calendar } from 'lucide-react';

export default function VerificationsPage() {
  const { token } = useAuthStore();
  const { addToast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    const fetchUsers = async () => {
      try {
        const res = await fetch(`${API_URL}/admin/users`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const all = await res.json();
          setUsers(all.filter((u: any) => u.role === 'manufacturer'));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [token]);

  const handleAction = async (userId: string, action: 'approve' | 'reject') => {
    setProcessing(userId);
    try {
      const res = await fetch(`${API_URL}/admin/verifications/${userId}/${action}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, verified: action === 'approve' } : u));
        addToast({ type: 'success', title: action === 'approve' ? 'Approved' : 'Rejected', message: `Manufacturer has been ${action}d.` });
      }
    } catch (err) {
      addToast({ type: 'error', title: 'Error', message: `Failed to ${action}.` });
    } finally {
      setProcessing(null);
    }
  };

  const pending = users.filter(u => !u.verified);
  const verified = users.filter(u => u.verified);

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading verifications...</div>;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}><Shield size={24} /> Manufacturer Verifications</h1>
        <p className={styles.subtitle}>Review and approve manufacturer applications.</p>
      </div>

      {/* Pending */}
      <div>
        <h2 className={styles.sectionTitle}>Pending Review ({pending.length})</h2>
        <div className={styles.list}>
          {pending.map(user => (
            <Card key={user.id} variant="bordered" padding="md" className={styles.card}>
              <div className={styles.cardInfo}>
                <Building2 size={20} className={styles.icon} />
                <div>
                  <h3 className={styles.name}>{user.companyName || user.name}</h3>
                  <p className={styles.meta}>{user.email} · {user.city || 'N/A'}</p>
                </div>
              </div>
              <div className={styles.cardActions}>
                <Button size="sm" variant="outline" icon={<XCircle size={14} />} loading={processing === user.id} onClick={() => handleAction(user.id, 'reject')}>Reject</Button>
                <Button size="sm" variant="primary" icon={<CheckCircle size={14} />} loading={processing === user.id} onClick={() => handleAction(user.id, 'approve')}>Approve</Button>
              </div>
            </Card>
          ))}
          {pending.length === 0 && <p className={styles.empty}>No pending verifications. All caught up! ✅</p>}
        </div>
      </div>

      {/* Verified */}
      <div>
        <h2 className={styles.sectionTitle}>Verified Manufacturers ({verified.length})</h2>
        <div className={styles.list}>
          {verified.map(user => (
            <Card key={user.id} variant="default" padding="md" className={styles.card}>
              <div className={styles.cardInfo}>
                <Building2 size={20} className={styles.icon} />
                <div>
                  <h3 className={styles.name}>{user.companyName || user.name}</h3>
                  <p className={styles.meta}>{user.email} · {user.city || 'N/A'}</p>
                </div>
              </div>
              <Badge variant="success" size="sm"><CheckCircle size={12} /> Verified</Badge>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

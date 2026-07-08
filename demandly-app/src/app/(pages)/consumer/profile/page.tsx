'use client';

import React, { useState, useEffect } from 'react';
import styles from './profile.module.css';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/components/ui/Toast';
import { API_URL } from '@/lib/api';
import { User, MapPin, Phone, Mail, Save, TrendingUp, ShoppingBag, Heart } from 'lucide-react';

interface ConsumerProfile {
  id?: string;
  name: string;
  email: string;
  city: string;
  pincode: string;
  phone: string;
  role: string;
}

interface ConsumerStats {
  activeInterests: number;
  activeOrders: number;
  totalSavings: number;
  savingsPercentage: number;
}

interface FormData {
  name: string;
  phone: string;
  city: string;
  pincode: string;
}

export default function ConsumerProfilePage() {
  const { token, user } = useAuthStore();
  const { addToast } = useToast();
  const [profile, setProfile] = useState<ConsumerProfile | null>(null);
  const [stats, setStats] = useState<ConsumerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    phone: '',
    city: '',
    pincode: ''
  });

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      if (!token) {
        if (!cancelled) setLoading(false);
        return;
      }
      try {
        // Fetch Profile
        const profileRes = await fetch(`${API_URL}/consumer/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (profileRes.ok && !cancelled) {
          const profileData = await profileRes.json();
          setProfile(profileData);
          setFormData({
            name: profileData.name || '',
            phone: profileData.phone || '',
            city: profileData.city || '',
            pincode: profileData.pincode || ''
          });
        }

        // Fetch Stats
        const statsRes = await fetch(`${API_URL}/consumer/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (statsRes.ok && !cancelled) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }
      } catch (err) {
        console.error('Error fetching consumer profile/stats data:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, [token]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/consumer/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          city: formData.city,
          pincode: formData.pincode
        })
      });
      if (res.ok) {
        setProfile(prev => prev ? { ...prev, ...formData } : null);
        setEditing(false);
        addToast({ type: 'success', title: 'Profile Updated', message: 'Your changes have been saved.' });
      } else {
        const errorData = await res.json();
        addToast({ type: 'error', title: 'Error', message: errorData.error || 'Failed to save profile.' });
      }
    } catch (err) {
      addToast({ type: 'error', title: 'Error', message: 'Failed to save profile.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading profile...</div>;

  const displayProfile = profile || {
    name: user?.name || 'Consumer',
    email: user?.email || '',
    city: '',
    pincode: '',
    phone: '',
    role: 'consumer'
  };

  const displayStats = stats || {
    activeInterests: 0,
    activeOrders: 0,
    totalSavings: 0,
    savingsPercentage: 0
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>My Profile</h1>
        <Button variant={editing ? 'outline' : 'primary'} onClick={() => setEditing(!editing)}>
          {editing ? 'Cancel' : 'Edit Profile'}
        </Button>
      </div>

      {/* Profile Card */}
      <Card variant="default" padding="lg" className={styles.profileCard}>
        <div className={styles.profileHeader}>
          <div className={styles.avatar}>
            <User size={32} />
          </div>
          <div className={styles.headerInfo}>
            <h2 className={styles.companyName}>{displayProfile.name}</h2>
            <div className={styles.badges}>
              <Badge variant="primary" size="sm">Consumer</Badge>
              {displayStats.totalSavings > 0 && (
                <Badge variant="success" size="sm">
                  <TrendingUp size={12} style={{ marginRight: '4px' }} />
                  Saved {displayStats.savingsPercentage}%
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className={styles.statsRow}>
          <div className={styles.statItem}>
            <Heart size={20} className="text-primary" style={{ marginBottom: '4px', color: 'var(--primary)' }} />
            <span className={styles.statValue}>{displayStats.activeInterests}</span>
            <span className={styles.statLabel}>Active Interests</span>
          </div>
          <div className={styles.statItem}>
            <ShoppingBag size={20} className="text-success" style={{ marginBottom: '4px', color: 'var(--success)' }} />
            <span className={styles.statValue}>{displayStats.activeOrders}</span>
            <span className={styles.statLabel}>Active Orders</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue} style={{ color: 'var(--success)' }}>
              ₹{displayStats.totalSavings.toLocaleString('en-IN')}
            </span>
            <span className={styles.statLabel}>Total Savings</span>
          </div>
        </div>
      </Card>

      {/* Details */}
      <Card variant="default" padding="lg">
        <h3 className={styles.sectionTitle}>Personal Information</h3>
        <div className={styles.formGrid}>
          <div className={styles.field}>
            <label className={styles.fieldLabel}><User size={14} /> Full Name</label>
            {editing ? (
              <input className="input" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} />
            ) : (
              <span className={styles.fieldValue}>{displayProfile.name}</span>
            )}
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel}><Mail size={14} /> Email Address</label>
            <span className={styles.fieldValue}>{displayProfile.email}</span>
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel}><Phone size={14} /> Phone Number</label>
            {editing ? (
              <input className="input" value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
            ) : (
              <span className={styles.fieldValue}>{displayProfile.phone || '—'}</span>
            )}
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel}><MapPin size={14} /> City</label>
            {editing ? (
              <input className="input" value={formData.city || ''} onChange={e => setFormData({ ...formData, city: e.target.value })} />
            ) : (
              <span className={styles.fieldValue}>{displayProfile.city || '—'}</span>
            )}
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel}><MapPin size={14} /> Pincode</label>
            {editing ? (
              <input className="input" value={formData.pincode || ''} onChange={e => setFormData({ ...formData, pincode: e.target.value })} />
            ) : (
              <span className={styles.fieldValue}>{displayProfile.pincode || '—'}</span>
            )}
          </div>
        </div>

        {editing && (
          <div className={styles.saveRow}>
            <Button loading={saving} onClick={handleSave}>Save Changes</Button>
          </div>
        )}
      </Card>
    </div>
  );
}

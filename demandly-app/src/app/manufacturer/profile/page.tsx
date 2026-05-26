'use client';

import React, { useState, useEffect } from 'react';
import styles from './profile.module.css';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/components/ui/Toast';
import { API_URL } from '@/lib/api';
import { User, Building2, MapPin, Phone, Mail, Shield, Star, Save, Award } from 'lucide-react';

export default function ProfilePage() {
  const { token, user } = useAuthStore();
  const { addToast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API_URL}/manufacturer/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
          setFormData(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [token]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/manufacturer/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setProfile(formData);
        setEditing(false);
        addToast({ type: 'success', title: 'Profile Updated', message: 'Your changes have been saved.' });
      }
    } catch (err) {
      addToast({ type: 'error', title: 'Error', message: 'Failed to save profile.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading profile...</div>;

  const displayProfile = profile || {
    name: user?.name || 'Manufacturer',
    email: user?.email || '',
    companyName: 'Your Company',
    city: '', pincode: '', phone: '',
    category: [], certifications: [],
    rating: 0, verified: false, totalOrders: 0, revenue: 0
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Manufacturer Profile</h1>
        <Button variant={editing ? 'outline' : 'primary'} onClick={() => setEditing(!editing)}>
          {editing ? 'Cancel' : 'Edit Profile'}
        </Button>
      </div>

      {/* Profile Card */}
      <Card variant="default" padding="lg" className={styles.profileCard}>
        <div className={styles.profileHeader}>
          <div className={styles.avatar}>
            <Building2 size={32} />
          </div>
          <div className={styles.headerInfo}>
            <h2 className={styles.companyName}>{displayProfile.companyName || displayProfile.name}</h2>
            <div className={styles.badges}>
              {displayProfile.verified && <Badge variant="success" size="sm"><Shield size={12} /> Verified</Badge>}
              {displayProfile.rating > 0 && <Badge variant="warning" size="sm"><Star size={12} /> {displayProfile.rating}</Badge>}
              {(displayProfile.certifications || []).map((cert: string) => (
                <Badge key={cert} variant="outline" size="sm"><Award size={10} /> {cert}</Badge>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.statsRow}>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{displayProfile.totalOrders}</span>
            <span className={styles.statLabel}>Total Orders</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{displayProfile.rating || 'N/A'}</span>
            <span className={styles.statLabel}>Rating</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{(displayProfile.category || []).length}</span>
            <span className={styles.statLabel}>Categories</span>
          </div>
        </div>
      </Card>

      {/* Details */}
      <Card variant="default" padding="lg">
        <h3 className={styles.sectionTitle}>Business Information</h3>
        <div className={styles.formGrid}>
          <div className={styles.field}>
            <label className={styles.fieldLabel}><Building2 size={14} /> Company Name</label>
            {editing ? (
              <input className="input" value={formData.companyName || ''} onChange={e => setFormData({ ...formData, companyName: e.target.value })} />
            ) : (
              <span className={styles.fieldValue}>{displayProfile.companyName || '—'}</span>
            )}
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel}><User size={14} /> Contact Person</label>
            {editing ? (
              <input className="input" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} />
            ) : (
              <span className={styles.fieldValue}>{displayProfile.name}</span>
            )}
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel}><Mail size={14} /> Email</label>
            <span className={styles.fieldValue}>{displayProfile.email}</span>
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel}><Phone size={14} /> Phone</label>
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
            <Button icon={<Save size={16} />} loading={saving} onClick={handleSave}>Save Changes</Button>
          </div>
        )}
      </Card>
    </div>
  );
}

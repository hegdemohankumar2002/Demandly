'use client';

import React, { useState, useEffect } from 'react';
import styles from './settings.module.css';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/components/ui/Toast';
import { API_URL } from '@/lib/api';
import {
  Settings, Bell, Shield, Palette, Globe, Save,
  Percent, Timer, Users, Zap, MessageSquare,
  CheckCircle, RotateCcw
} from 'lucide-react';

interface PlatformSettings {
  platformName: string;
  currency: string;
  region: string;
  defaultThreshold: number;
  auctionDurationHours: number;
  autoCloseNoActivityHrs: number;
  commissionPercent: number;
  flashEventMinUnits: number;
  campaignVoteGoal: number;
  emailNewRegistrations: boolean;
  emailThresholdMet: boolean;
  emailDailyDigest: boolean;
  emailNewDemandPools: boolean;
  requireEmailVerification: boolean;
  twoFactorForAdmins: boolean;
  autoLockAfterAttempts: number;
}

const defaults: PlatformSettings = {
  platformName: 'Demandly',
  currency: 'INR',
  region: 'India',
  defaultThreshold: 300,
  auctionDurationHours: 48,
  autoCloseNoActivityHrs: 72,
  commissionPercent: 5.0,
  flashEventMinUnits: 50,
  campaignVoteGoal: 100,
  emailNewRegistrations: true,
  emailThresholdMet: true,
  emailDailyDigest: true,
  emailNewDemandPools: true,
  requireEmailVerification: true,
  twoFactorForAdmins: false,
  autoLockAfterAttempts: 5,
};

export default function AdminSettingsPage() {
  const { token } = useAuthStore();
  const { addToast } = useToast();
  const [settings, setSettings] = useState<PlatformSettings>(defaults);
  const [original, setOriginal] = useState<PlatformSettings>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${API_URL}/admin/settings`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setSettings(data);
          setOriginal(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [token]);

  useEffect(() => {
    setHasChanges(JSON.stringify(settings) !== JSON.stringify(original));
  }, [settings, original]);

  const update = (key: keyof PlatformSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/admin/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        const updated = await res.json();
        setSettings(updated);
        setOriginal(updated);
        addToast({ type: 'success', title: 'Settings Saved', message: 'Platform configuration has been updated.' });
      }
    } catch (err) {
      addToast({ type: 'error', title: 'Error', message: 'Failed to save settings.' });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(original);
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading settings...</div>;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}><Settings size={24} /> Platform Settings</h1>
          <p className={styles.subtitle}>Configure platform-wide settings, thresholds, and policies.</p>
        </div>
        <div className={styles.headerActions}>
          {hasChanges && (
            <Badge variant="warning" dot pulse>Unsaved Changes</Badge>
          )}
          <Button variant="outline" icon={<RotateCcw size={14} />} onClick={handleReset} disabled={!hasChanges}>Reset</Button>
          <Button icon={<Save size={16} />} loading={saving} onClick={handleSave} disabled={!hasChanges}>Save Changes</Button>
        </div>
      </div>

      <div className={styles.grid}>
        {/* ─── General ─── */}
        <Card padding="lg" className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.iconBadge} style={{ background: 'hsla(211, 40%, 50%, 0.1)' }}>
              <Globe size={18} style={{ color: 'var(--primary)' }} />
            </div>
            <h3 className={styles.sectionTitle}>General</h3>
          </div>
          <div className={styles.fields}>
            <div className={styles.field}>
              <label className={styles.label}>Platform Name</label>
              <input className="input" value={settings.platformName} onChange={e => update('platformName', e.target.value)} />
            </div>
            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label className={styles.label}>Currency</label>
                <select className="input" value={settings.currency} onChange={e => update('currency', e.target.value)}>
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Default Region</label>
                <input className="input" value={settings.region} onChange={e => update('region', e.target.value)} />
              </div>
            </div>
          </div>
        </Card>

        {/* ─── Demand Pool & Auction ─── */}
        <Card padding="lg" className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.iconBadge} style={{ background: 'hsla(44, 70%, 50%, 0.1)' }}>
              <Timer size={18} style={{ color: 'var(--accent)' }} />
            </div>
            <h3 className={styles.sectionTitle}>Demand Pool & Auction</h3>
          </div>
          <div className={styles.fields}>
            <div className={styles.field}>
              <label className={styles.label}>Default Demand Threshold</label>
              <div className={styles.inputWithHint}>
                <input className="input" type="number" value={settings.defaultThreshold} onChange={e => update('defaultThreshold', parseInt(e.target.value) || 0)} />
                <span className={styles.hint}>Min. units to trigger auction</span>
              </div>
            </div>
            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label className={styles.label}>Auction Duration</label>
                <div className={styles.inputWithUnit}>
                  <input className="input" type="number" value={settings.auctionDurationHours} onChange={e => update('auctionDurationHours', parseInt(e.target.value) || 0)} />
                  <span className={styles.unitLabel}>hours</span>
                </div>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Auto-Close (No Activity)</label>
                <div className={styles.inputWithUnit}>
                  <input className="input" type="number" value={settings.autoCloseNoActivityHrs} onChange={e => update('autoCloseNoActivityHrs', parseInt(e.target.value) || 0)} />
                  <span className={styles.unitLabel}>hours</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* ─── Commission & Pricing ─── */}
        <Card padding="lg" className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.iconBadge} style={{ background: 'hsla(142, 60%, 40%, 0.1)' }}>
              <Percent size={18} style={{ color: 'var(--success)' }} />
            </div>
            <h3 className={styles.sectionTitle}>Commission & Pricing</h3>
          </div>
          <div className={styles.fields}>
            <div className={styles.field}>
              <label className={styles.label}>Platform Commission</label>
              <div className={styles.inputWithUnit}>
                <input className="input" type="number" step="0.5" min="0" max="100" value={settings.commissionPercent} onChange={e => update('commissionPercent', parseFloat(e.target.value) || 0)} />
                <span className={styles.unitLabel}>%</span>
              </div>
              <span className={styles.hint}>Applied on each fulfilled order (5–15% recommended)</span>
            </div>
            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label className={styles.label}>Flash Event Min Units</label>
                <input className="input" type="number" value={settings.flashEventMinUnits} onChange={e => update('flashEventMinUnits', parseInt(e.target.value) || 0)} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Campaign Vote Goal</label>
                <input className="input" type="number" value={settings.campaignVoteGoal} onChange={e => update('campaignVoteGoal', parseInt(e.target.value) || 0)} />
              </div>
            </div>
          </div>
        </Card>

        {/* ─── Notifications ─── */}
        <Card padding="lg" className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.iconBadge} style={{ background: 'hsla(280, 60%, 50%, 0.1)' }}>
              <Bell size={18} style={{ color: 'hsl(280, 60%, 50%)' }} />
            </div>
            <h3 className={styles.sectionTitle}>Email Notifications</h3>
          </div>
          <div className={styles.toggleList}>
            <label className={styles.toggleItem}>
              <div className={styles.toggleInfo}>
                <span className={styles.toggleLabel}>New Registrations</span>
                <span className={styles.toggleDesc}>Get notified when a new manufacturer registers</span>
              </div>
              <input type="checkbox" className={styles.toggle} checked={settings.emailNewRegistrations} onChange={e => update('emailNewRegistrations', e.target.checked)} />
            </label>
            <label className={styles.toggleItem}>
              <div className={styles.toggleInfo}>
                <span className={styles.toggleLabel}>Threshold Reached</span>
                <span className={styles.toggleDesc}>Alert when a demand pool reaches its threshold</span>
              </div>
              <input type="checkbox" className={styles.toggle} checked={settings.emailThresholdMet} onChange={e => update('emailThresholdMet', e.target.checked)} />
            </label>
            <label className={styles.toggleItem}>
              <div className={styles.toggleInfo}>
                <span className={styles.toggleLabel}>Daily Digest</span>
                <span className={styles.toggleDesc}>Summary of platform activity sent every morning</span>
              </div>
              <input type="checkbox" className={styles.toggle} checked={settings.emailDailyDigest} onChange={e => update('emailDailyDigest', e.target.checked)} />
            </label>
            <label className={styles.toggleItem}>
              <div className={styles.toggleInfo}>
                <span className={styles.toggleLabel}>New Demand Pools</span>
                <span className={styles.toggleDesc}>Notify manufacturers when new pools are created</span>
              </div>
              <input type="checkbox" className={styles.toggle} checked={settings.emailNewDemandPools} onChange={e => update('emailNewDemandPools', e.target.checked)} />
            </label>
          </div>
        </Card>

        {/* ─── Security ─── */}
        <Card padding="lg" className={styles.section} style={{ gridColumn: '1 / -1' }}>
          <div className={styles.sectionHeader}>
            <div className={styles.iconBadge} style={{ background: 'hsla(0, 60%, 50%, 0.1)' }}>
              <Shield size={18} style={{ color: 'var(--danger)' }} />
            </div>
            <h3 className={styles.sectionTitle}>Security</h3>
          </div>
          <div className={styles.securityGrid}>
            <label className={styles.toggleItem}>
              <div className={styles.toggleInfo}>
                <span className={styles.toggleLabel}>Require Email Verification</span>
                <span className={styles.toggleDesc}>New accounts must verify email before access</span>
              </div>
              <input type="checkbox" className={styles.toggle} checked={settings.requireEmailVerification} onChange={e => update('requireEmailVerification', e.target.checked)} />
            </label>
            <label className={styles.toggleItem}>
              <div className={styles.toggleInfo}>
                <span className={styles.toggleLabel}>Two-Factor for Admins</span>
                <span className={styles.toggleDesc}>Enforce 2FA for all admin accounts</span>
              </div>
              <input type="checkbox" className={styles.toggle} checked={settings.twoFactorForAdmins} onChange={e => update('twoFactorForAdmins', e.target.checked)} />
            </label>
            <div className={styles.field}>
              <label className={styles.label}>Auto-Lock After Failed Attempts</label>
              <div className={styles.inputWithUnit}>
                <input className="input" type="number" min="1" max="20" value={settings.autoLockAfterAttempts} onChange={e => update('autoLockAfterAttempts', parseInt(e.target.value) || 5)} />
                <span className={styles.unitLabel}>attempts</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Sticky Save Bar */}
      {hasChanges && (
        <div className={styles.stickyBar}>
          <span className={styles.stickyText}>You have unsaved changes</span>
          <div className={styles.stickyActions}>
            <Button variant="outline" size="sm" onClick={handleReset}>Discard</Button>
            <Button size="sm" icon={<Save size={14} />} loading={saving} onClick={handleSave}>Save Changes</Button>
          </div>
        </div>
      )}
    </div>
  );
}

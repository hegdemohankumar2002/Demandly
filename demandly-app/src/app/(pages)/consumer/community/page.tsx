'use client';

import React, { useState, useEffect } from 'react';
import styles from './community.module.css';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import ProgressRing from '@/components/ui/ProgressRing';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/components/ui/Toast';
import { API_URL } from '@/lib/api';
import { getStatusLabel } from '@/lib/utils';
import { MessageSquare, ThumbsUp, Plus, Users, Lightbulb, TrendingUp, CheckCircle } from 'lucide-react';

const statusFilters = ['All', 'voting', 'approved', 'in_production', 'completed'];

interface Campaign {
  id: string;
  title: string;
  description: string;
  category: string;
  votes: number;
  totalVotes: number;
  author: { name: string; avatar?: string; city?: string };
  status: string;
  createdAt: string;
  comments: number;
}

export default function CommunityPage() {
  const { token, user } = useAuthStore();
  const { addToast } = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [voting, setVoting] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newCampaign, setNewCampaign] = useState({ title: '', description: '', category: 'Groceries' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetchCampaigns = async () => {
      try {
        const res = await fetch(`${API_URL}/consumer/campaigns`);
        if (res.ok && !cancelled) setCampaigns(await res.json());
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchCampaigns();
    return () => { cancelled = true; };
  }, []);

  const handleVote = async (campaignId: string) => {
    if (!token) {
      addToast({ type: 'error', title: 'Sign In Required', message: 'Please sign in to vote.' });
      return;
    }
    setVoting(campaignId);
    try {
      const res = await fetch(`${API_URL}/consumer/campaigns/${campaignId}/vote`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const updated = await res.json();
        setCampaigns(prev => prev.map(c => c.id === campaignId ? { ...c, votes: updated.votes, status: updated.status } : c));
        addToast({ type: 'success', title: 'Vote Recorded! 🗳️', message: 'Your vote has been counted.' });
      }
    } catch (err) {
      addToast({ type: 'error', title: 'Error', message: 'Failed to vote.' });
    } finally {
      setVoting(null);
    }
  };

  const handleCreate = async () => {
    if (!token) {
      addToast({ type: 'error', title: 'Sign In Required', message: 'Please sign in to create campaigns.' });
      return;
    }
    setCreating(true);
    try {
      const res = await fetch(`${API_URL}/consumer/campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newCampaign)
      });
      if (res.ok) {
        const created = await res.json();
        setCampaigns(prev => [{ ...created, author: { name: user?.name || 'You' } }, ...prev]);
        setShowCreate(false);
        setNewCampaign({ title: '', description: '', category: 'Groceries' });
        addToast({ type: 'success', title: 'Campaign Created!', message: 'Others can now vote on your idea.' });
      }
    } catch (err) {
      addToast({ type: 'error', title: 'Error', message: 'Failed to create campaign.' });
    } finally {
      setCreating(false);
    }
  };

  const filtered = filter === 'All' ? campaigns : campaigns.filter(c => c.status === filter);

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading campaigns...</div>;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}><Lightbulb size={28} className={styles.titleIcon} /> Community Campaigns</h1>
          <p className={styles.subtitle}>What should we make next? Propose ideas, vote, and shape what Demandly manufactures.</p>
        </div>
        <Button icon={<Plus size={16} />} variant="primary" onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? 'Cancel' : 'New Campaign'}
        </Button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <Card variant="bordered" padding="lg" className={styles.createCard}>
          <h3 className={styles.createTitle}>Propose a Product</h3>
          <div className={styles.form}>
            <div className={styles.field}>
              <label className="label">Title</label>
              <input className="input" placeholder="e.g. Organic Honey from Coorg" value={newCampaign.title} onChange={e => setNewCampaign(prev => ({ ...prev, title: e.target.value }))} />
            </div>
            <div className={styles.field}>
              <label className="label">Description</label>
              <textarea className="input" rows={3} placeholder="Why should we make this? What problem does it solve?" value={newCampaign.description} onChange={e => setNewCampaign(prev => ({ ...prev, description: e.target.value }))} />
            </div>
            <div className={styles.field}>
              <label className="label">Category</label>
              <select className="input" value={newCampaign.category} onChange={e => setNewCampaign(prev => ({ ...prev, category: e.target.value }))}>
                <option>Groceries</option>
                <option>Personal Care</option>
                <option>Homeware</option>
                <option>Sustainability</option>
                <option>Health</option>
                <option>Other</option>
              </select>
            </div>
            <Button fullWidth loading={creating} onClick={handleCreate} disabled={!newCampaign.title || !newCampaign.description}>Submit Campaign</Button>
          </div>
        </Card>
      )}

      {/* Filters */}
      <div className={styles.filters}>
        {statusFilters.map(s => (
          <button key={s} className={`${styles.filterBtn} ${filter === s ? styles.filterActive : ''}`} onClick={() => setFilter(s)}>
            {s === 'All' ? 'All' : getStatusLabel(s)}
          </button>
        ))}
      </div>

      {/* Campaign List */}
      <div className={styles.list}>
        {filtered.map((campaign) => {
          const progress = Math.round((campaign.votes / campaign.totalVotes) * 100);
          return (
            <Card key={campaign.id} variant="default" padding="md" className={styles.campaignCard}>
              <div className={styles.cardTop}>
                <div className={styles.cardInfo}>
                  <Badge variant={campaign.status === 'voting' ? 'primary' : campaign.status === 'approved' ? 'success' : 'accent'} size="sm">
                    {getStatusLabel(campaign.status)}
                  </Badge>
                  <h3 className={styles.campaignTitle}>{campaign.title}</h3>
                  <p className={styles.campaignDesc}>{campaign.description}</p>
                </div>
                <ProgressRing current={campaign.votes} total={campaign.totalVotes} size={64} strokeWidth={5} variant={progress >= 80 ? 'accent' : 'primary'} />
              </div>

              <div className={styles.cardMeta}>
                <span className={styles.metaItem}><Users size={14} /> {campaign.author?.name || 'Anonymous'} · {campaign.author?.city || ''}</span>
                <span className={styles.metaItem}><MessageSquare size={14} /> {campaign.comments} comments</span>
                <Badge variant="outline" size="sm">{campaign.category}</Badge>
              </div>

              <div className={styles.cardActions}>
                <span className={styles.voteCount}>
                  <ThumbsUp size={16} /> {campaign.votes}/{campaign.totalVotes} votes
                </span>
                {campaign.status === 'voting' ? (
                  <Button size="sm" variant="primary" icon={<ThumbsUp size={14} />} loading={voting === campaign.id} onClick={() => handleVote(campaign.id)}>
                    Vote
                  </Button>
                ) : (
                  <Badge variant="success" size="sm"><CheckCircle size={12} /> Goal Reached</Badge>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <Card padding="lg" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <Lightbulb size={48} style={{ margin: '0 auto 1rem', color: 'var(--primary)' }} />
          <h2 style={{ fontSize: '18px', fontWeight: '500', marginBottom: '0.5rem' }}>No campaigns found</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Be the first to propose a product idea!</p>
        </Card>
      )}
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import styles from './propose.module.css';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/components/ui/Toast';
import { API_URL } from '@/lib/api';
import { uploadFile } from '@/lib/upload';
import { Package, Plus, Search, Tag, DollarSign, Scale, FileText, Image } from 'lucide-react';
import { formatCurrency, getStatusLabel } from '@/lib/utils';

export default function ProposeProductPage() {
  const { token } = useAuthStore();
  const { addToast } = useToast();
  
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Groceries',
    proposedPrice: '',
    unit: 'kg'
  });

  const fetchProposals = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/manufacturer/proposals`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setProposals(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals();
  }, [token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      let imageUrl = '';
      if (selectedFile && token) {
        imageUrl = await uploadFile(selectedFile, token);
      }

      const res = await fetch(`${API_URL}/manufacturer/proposals`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          image: imageUrl || undefined
        })
      });
      
      if (!res.ok) throw new Error('Failed to submit proposal');
      
      addToast({ type: 'success', title: 'Submitted', message: 'Product proposal sent for admin review.' });
      setFormData({ name: '', description: '', category: 'Groceries', proposedPrice: '', unit: 'kg' });
      setSelectedFile(null);
      fetchProposals();
    } catch (error: any) {
      addToast({ type: 'error', title: 'Error', message: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}><Package size={24} /> Propose a Product</h1>
        <p className={styles.subtitle}>Submit items you can manufacture to be added to the live catalog.</p>
      </div>

      <div className={styles.grid}>
        {/* Left Column: Form */}
        <div className={styles.mainCol}>
          <Card variant="glass" padding="lg">
            <CardHeader>
              <CardTitle>Product Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.field}>
                  <label className="label">Product Name</label>
                  <div className={styles.inputWrapper}>
                    <Tag size={18} className={styles.inputIcon} />
                    <input 
                      required 
                      type="text" 
                      name="name"
                      className="input" 
                      placeholder="e.g. Organic Cold-Pressed Coconut Oil"
                      value={formData.name}
                      onChange={handleChange}
                      style={{ paddingLeft: '40px' }}
                    />
                  </div>
                </div>

                <div className={styles.field}>
                  <label className="label">Description</label>
                  <div className={styles.inputWrapper}>
                    <FileText size={18} className={styles.inputIcon} style={{ top: '12px', transform: 'none' }} />
                    <textarea 
                      required 
                      name="description"
                      className="input" 
                      placeholder="Provide quality details, minimum standards, etc."
                      value={formData.description}
                      onChange={handleChange}
                      style={{ paddingLeft: '40px', minHeight: '100px', paddingTop: '10px' }}
                    />
                  </div>
                </div>

                <div className={styles.rowGrid}>
                  <div className={styles.field}>
                    <label className="label">Category</label>
                    <select name="category" className="input" value={formData.category} onChange={handleChange}>
                      <option value="Groceries">Groceries</option>
                      <option value="Personal Care">Personal Care</option>
                      <option value="Home & Living">Home & Living</option>
                      <option value="Lifestyle">Lifestyle</option>
                      <option value="Health">Health</option>
                    </select>
                  </div>
                  <div className={styles.field}>
                    <label className="label">Unit</label>
                    <div className={styles.inputWrapper}>
                      <Scale size={18} className={styles.inputIcon} />
                      <input 
                        required 
                        type="text" 
                        name="unit"
                        className="input" 
                        placeholder="e.g. kg, liter, unit"
                        value={formData.unit}
                        onChange={handleChange}
                        style={{ paddingLeft: '40px' }}
                      />
                    </div>
                  </div>
                </div>

                <div className={styles.field}>
                  <label className="label">Standard Price (MSRP)</label>
                  <div className={styles.inputWrapper}>
                    <DollarSign size={18} className={styles.inputIcon} />
                    <input 
                      required 
                      type="number" 
                      name="proposedPrice"
                      className="input" 
                      placeholder="Your standard retail price"
                      value={formData.proposedPrice}
                      onChange={handleChange}
                      style={{ paddingLeft: '40px' }}
                    />
                  </div>
                  <p className={styles.hint}>This will anchor the starting price of the reverse auction.</p>
                </div>

                <div className={styles.field}>
                  <label className="label">Product Image</label>
                  <div className={styles.inputWrapper}>
                    <Image size={18} className={styles.inputIcon} />
                    <input 
                      type="file" 
                      accept="image/*"
                      className="input" 
                      onChange={handleFileChange}
                      style={{ paddingLeft: '40px', paddingTop: '8px' }}
                    />
                  </div>
                  <p className={styles.hint}>Upload a clear image of the proposed product.</p>
                </div>

                <Button type="submit" size="lg" loading={submitting} icon={<Plus size={18} />}>
                  Submit Proposal
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: List */}
        <div className={styles.sideCol}>
          <Card variant="default" padding="md">
            <CardHeader>
              <CardTitle>My Proposals</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p>Loading...</p>
              ) : proposals.length === 0 ? (
                <div className={styles.empty}>
                  <Search size={32} />
                  <p>No proposals submitted yet.</p>
                </div>
              ) : (
                <div className={styles.proposalList}>
                  {proposals.map(p => (
                    <div key={p.id} className={styles.proposalItem}>
                      <div className={styles.pInfo}>
                        <h4 className={styles.pName}>{p.name}</h4>
                        <p className={styles.pMeta}>{formatCurrency(p.proposedPrice)} / {p.unit}</p>
                      </div>
                      <Badge variant={p.status === 'approved' ? 'success' : p.status === 'rejected' ? 'danger' : 'warning'} size="sm">
                        {p.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

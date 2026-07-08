'use client';

import React, { useState, useEffect, useCallback } from 'react';
import styles from './approvals.module.css';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/components/ui/Toast';
import { API_URL } from '@/lib/api';
import { Package, Check, X, Search, Factory, DollarSign, Target } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface Proposal {
  id: string;
  name: string;
  description: string;
  category: string;
  proposedPrice: number;
  unit: string;
  image?: string;
  status: string;
  createdAt: string;
  manufacturer?: {
    name: string;
    companyName?: string;
  };
}

export default function CatalogApprovalsPage() {
  const { token } = useAuthStore();
  const { addToast } = useToast();
  
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [threshold, setThreshold] = useState('500');
  const [processing, setProcessing] = useState(false);

  const fetchProposals = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/admin/proposals/pending`, {
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
  }, [token]);

  useEffect(() => {
    let cancelled = false;
    const doFetch = async () => {
      await fetchProposals();
    };
    doFetch();
    return () => { cancelled = true; };
  }, [fetchProposals]);

  const handleApprove = async () => {
    if (!selectedProposal || !threshold) return;
    setProcessing(true);
    
    try {
      const res = await fetch(`${API_URL}/admin/proposals/${selectedProposal.id}/approve`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ demandThreshold: parseInt(threshold) })
      });
      
      if (!res.ok) throw new Error('Failed to approve');
      
      addToast({ type: 'success', title: 'Approved', message: 'Product added to live catalog!' });
      setSelectedProposal(null);
      fetchProposals();
    } catch (error: any) {
      addToast({ type: 'error', title: 'Error', message: error.message || 'Failed to approve' });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/admin/proposals/${id}/reject`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to reject');
      addToast({ type: 'success', title: 'Rejected', message: 'Proposal rejected.' });
      fetchProposals();
    } catch (error: any) {
      addToast({ type: 'error', title: 'Error', message: error.message || 'Failed to reject' });
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}><Package size={24} /> Catalog Approvals</h1>
        <p className={styles.subtitle}>Review and approve products proposed by manufacturers.</p>
      </div>

      <Card variant="default" padding="none">
        <CardContent>
          {loading ? (
            <div className={styles.loading}>Loading proposals...</div>
          ) : proposals.length === 0 ? (
            <div className={styles.empty}>
              <Search size={48} />
              <h3>No Pending Proposals</h3>
              <p>Manufacturers haven&apos;t submitted any new products recently.</p>
            </div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Manufacturer</th>
                    <th>Proposed MSRP</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {proposals.map(p => (
                    <tr key={p.id}>
                      <td>
                        <div className={styles.productCell}>
                          <p className={styles.pName}>{p.name}</p>
                          <p className={styles.pDesc}>{p.description.substring(0, 50)}...</p>
                        </div>
                      </td>
                      <td><Badge variant="secondary" size="sm">{p.category}</Badge></td>
                      <td>
                        <div className={styles.mfgCell}>
                          <Factory size={14} />
                          <span>{p.manufacturer?.companyName || p.manufacturer?.name || 'Unknown Manufacturer'}</span>
                        </div>
                      </td>
                      <td className={styles.priceCell}>{formatCurrency(p.proposedPrice)} / {p.unit}</td>
                      <td>
                        <div className={styles.actions}>
                          <Button 
                            variant="primary" 
                            size="sm" 
                            icon={<Check size={14} />}
                            onClick={() => setSelectedProposal(p)}
                          >
                            Review
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            icon={<X size={14} />}
                            onClick={() => handleReject(p.id)}
                            className={styles.rejectBtn}
                          >
                            Reject
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approval Modal */}
      {selectedProposal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Approve Product</h3>
              <button className={styles.closeBtn} onClick={() => setSelectedProposal(null)}><X size={20} /></button>
            </div>
            
            <div className={styles.modalBody}>
              <div className={styles.modalDetail}>
                <span className={styles.modalLabel}>Product Name</span>
                <span className={styles.modalValue}>{selectedProposal.name}</span>
              </div>
              <div className={styles.modalDetail}>
                <span className={styles.modalLabel}>Proposed Retail Price</span>
                <span className={styles.modalValue}>{formatCurrency(selectedProposal.proposedPrice)} / {selectedProposal.unit}</span>
              </div>
              
              <div className={styles.modalForm}>
                <label className={styles.modalLabel}><Target size={14} /> Set Demand Threshold</label>
                <p className={styles.modalHint}>How many units must consumers demand to trigger the reverse auction?</p>
                <input 
                  type="number" 
                  className={styles.input}
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                />
              </div>
            </div>

            <div className={styles.modalFooter}>
              <Button variant="ghost" onClick={() => setSelectedProposal(null)}>Cancel</Button>
              <Button variant="primary" onClick={handleApprove} loading={processing}>Approve & Publish</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

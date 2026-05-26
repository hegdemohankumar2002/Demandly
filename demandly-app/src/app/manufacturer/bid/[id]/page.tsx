'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './bid.module.css';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import CountdownTimer from '@/components/ui/CountdownTimer';
import { useToast } from '@/components/ui/Toast';
import { useAuthStore } from '@/stores/authStore';
import { formatCurrency, getStatusLabel } from '@/lib/utils';
import { API_URL } from '@/lib/api';
import { ArrowLeft, Factory, MapPin, Check, FileText, IndianRupee, Clock, Zap } from 'lucide-react';

export default function BidPage() {
  const params = useParams();
  const router = useRouter();
  const { addToast } = useToast();
  const { token } = useAuthStore();
  
  const [pool, setPool] = useState<any>(null);
  const [existingBid, setExistingBid] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [bidPrice, setBidPrice] = useState(0);
  const [deliveryDays, setDeliveryDays] = useState(7);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  React.useEffect(() => {
    if (!token) return;
    const fetchPool = async () => {
      try {
        const res = await fetch(`${API_URL}/manufacturer/demand-pools/${params.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setPool(data.pool);
          setExistingBid(data.bid);
          setBidPrice(data.bid ? data.bid.pricePerUnit : Math.round((data.pool?.averageMaxPrice || 0) * 0.9));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPool();
  }, [token, params.id]);

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading details...</div>;

  if (!pool) {
    return (
      <div className={styles.notFound}>
        <Factory size={48} />
        <h2>Demand Pool not found</h2>
        <Link href="/manufacturer/demand-pools">
          <Button variant="outline" icon={<ArrowLeft size={16} />}>Back to Pools</Button>
        </Link>
      </div>
    );
  }

  const handleBidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const res = await fetch(`${API_URL}/manufacturer/bids`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          demandPoolId: params.id,
          pricePerUnit: bidPrice,
          deliveryTimeline: `${deliveryDays} Days`,
          notes
        })
      });

      if (!res.ok) throw new Error('Failed to submit bid');

      setSuccess(true);
      addToast({
        type: 'success',
        title: 'Bid Placed Successfully!',
        message: `Your bid of ${formatCurrency(bidPrice)} has been registered.`,
      });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const isLeading = bidPrice < (pool.bestBidPrice || Infinity);

  return (
    <div className={styles.page}>
      <Link href="/manufacturer/demand-pools" className={styles.backLink}>
        <ArrowLeft size={16} />
        Back to Demand Pools
      </Link>

      <div className={styles.layout}>
        {/* Left: Pool Details */}
        <div className={styles.leftCol}>
          <Card variant="default" padding="lg" className={styles.poolCard}>
            <div className={styles.poolHeader}>
              <div>
                <Badge 
                  variant={pool.status === 'auction_active' ? 'accent' : 'warning'} 
                  dot 
                  pulse={pool.status === 'auction_active'}
                  className={styles.statusBadge}
                >
                  {getStatusLabel(pool.status)}
                </Badge>
                <h1 className={styles.productName}>{pool.product.name}</h1>
                <p className={styles.productCategory}>{pool.product.category}</p>
              </div>
              {pool.status === 'auction_active' && (
                <div className={styles.timerWrapper}>
                  <span className={styles.timerLabel}>Auction Ends In</span>
                  <CountdownTimer deadline={pool.deadline} />
                </div>
              )}
            </div>

            <div className={styles.specsGrid}>
              <div className={styles.specBox}>
                <span className={styles.specLabel}>Total Demand</span>
                <span className={styles.specValueHighlight}>{pool.totalDemand} <span className={styles.specUnit}>{pool.product.unit}s</span></span>
              </div>
              <div className={styles.specBox}>
                <span className={styles.specLabel}>Retail Value</span>
                <span className={styles.specValue}>{formatCurrency(pool.totalDemand * pool.product.retailPrice)}</span>
              </div>
              <div className={styles.specBox}>
                <span className={styles.specLabel}>Delivery Region</span>
                <span className={styles.specValue}>
                  <MapPin size={14} className={styles.inlineIcon} />
                  {pool.geography} ({pool.pincode})
                </span>
              </div>
              <div className={styles.specBox}>
                <span className={styles.specLabel}>Average Max Price</span>
                <span className={styles.specValue}>{formatCurrency(pool.averageMaxPrice)}</span>
              </div>
            </div>

            <div className={styles.marketIntel}>
              <h3 className={styles.marketTitle}>
                <Zap size={16} className={styles.marketIcon} />
                Market Intelligence
              </h3>
              <div className={styles.marketData}>
                <div className={styles.dataRow}>
                  <span>Current Best Bid</span>
                  <span className={styles.bestBid}>{pool.bestBidPrice ? formatCurrency(pool.bestBidPrice) : 'No bids yet'}</span>
                </div>
                <div className={styles.dataRow}>
                  <span>Total Bids Placed</span>
                  <span>{pool.bidsCount} bids</span>
                </div>
                <div className={styles.dataRow}>
                  <span>Estimated Win Price</span>
                  <span className={styles.estWin}>~{formatCurrency(pool.averageMaxPrice * 0.85)}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right: Bid Form */}
        <div className={styles.rightCol}>
          {!success ? (
            <Card variant="bordered" padding="lg" className={styles.formCard}>
              <div className={styles.formHeader}>
                <h2 className={styles.formTitle}>
                  {existingBid ? 'Revise Your Bid' : 'Place Your Bid'}
                </h2>
                {existingBid && (
                  <Badge variant="warning">You have an active bid</Badge>
                )}
              </div>

              <form onSubmit={handleBidSubmit} className={styles.form}>
                <div className={styles.field}>
                  <label className="label">Your Bid Price (per {pool.product.unit})</label>
                  <div className={styles.inputWrapper}>
                    <IndianRupee size={18} className={styles.inputIcon} />
                    <input
                      type="number"
                      min={1}
                      max={pool.product.retailPrice}
                      step={1}
                      required
                      value={bidPrice}
                      onChange={(e) => setBidPrice(Number(e.target.value))}
                      className={`input ${styles.priceInput}`}
                    />
                  </div>
                  <div className={styles.bidFeedback}>
                    {bidPrice > pool.product.retailPrice ? (
                      <span className={styles.feedbackError}>Price exceeds retail price!</span>
                    ) : bidPrice > pool.averageMaxPrice ? (
                      <span className={styles.feedbackWarning}>Your bid is higher than the customer&apos;s average demanded price, but is still valid.</span>
                    ) : pool.bestBidPrice && bidPrice >= pool.bestBidPrice ? (
                      <span className={styles.feedbackWarning}>Your bid is higher than the current best.</span>
                    ) : (
                      <span className={styles.feedbackSuccess}>You will be the leading bidder!</span>
                    )}
                  </div>
                </div>

                <div className={styles.summaryBox}>
                  <div className={styles.summaryRow}>
                    <span>Order Value (Gross)</span>
                    <span>{formatCurrency(bidPrice * pool.totalDemand)}</span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span>Platform Fee (3%)</span>
                    <span className={styles.fee}>-{formatCurrency(bidPrice * pool.totalDemand * 0.03)}</span>
                  </div>
                  <div className={styles.summaryDivider} />
                  <div className={styles.summaryRowTotal}>
                    <span>Estimated Net Revenue</span>
                    <span className={styles.netRevenue}>
                      {formatCurrency(bidPrice * pool.totalDemand * 0.97)}
                    </span>
                  </div>
                </div>

                <div className={styles.field}>
                  <label className="label">Estimated Delivery Time</label>
                  <div className={styles.inputWrapper}>
                    <Clock size={18} className={styles.inputIcon} />
                    <select 
                      className={`input ${styles.selectInput}`}
                      value={deliveryDays}
                      onChange={(e) => setDeliveryDays(Number(e.target.value))}
                    >
                      <option value={3}>3 Days</option>
                      <option value={7}>7 Days (1 Week)</option>
                      <option value={14}>14 Days (2 Weeks)</option>
                      <option value={30}>30 Days (1 Month)</option>
                    </select>
                  </div>
                </div>

                <div className={styles.field}>
                  <label className="label">Additional Terms/Notes (Optional)</label>
                  <textarea
                    className="input"
                    rows={3}
                    placeholder="e.g. Includes premium packaging"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                <div className={styles.actions}>
                  <Button
                    type="submit"
                    size="lg"
                    fullWidth
                    loading={submitting}
                    disabled={bidPrice > pool.product.retailPrice || bidPrice <= 0}
                    icon={<FileText size={18} />}
                  >
                    Submit Binding Bid
                  </Button>
                  <p className={styles.disclaimer}>
                    By submitting, you agree to fulfill the entire order at this price if you win.
                  </p>
                </div>
              </form>
            </Card>
          ) : (
            <Card variant="bordered" padding="lg" className={styles.successCard}>
              <div className={styles.successIcon}>
                <Check size={40} />
              </div>
              <h2 className={styles.successTitle}>Bid Submitted!</h2>
              <p className={styles.successDesc}>
                Your bid of <strong>{formatCurrency(bidPrice)}</strong> has been registered.
                {isLeading ? ' You are currently the leading bidder.' : ' However, you are not the leading bidder.'}
              </p>
              
              <div className={styles.successActions}>
                <Button variant="outline" onClick={() => setSuccess(false)}>Revise Bid</Button>
                <Link href="/manufacturer/my-bids">
                  <Button variant="primary">View My Bids</Button>
                </Link>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

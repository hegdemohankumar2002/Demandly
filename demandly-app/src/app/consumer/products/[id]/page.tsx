'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import styles from './detail.module.css';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import ProgressRing from '@/components/ui/ProgressRing';
import Carousel from '@/components/ui/Carousel';
import { useToast } from '@/components/ui/Toast';
import { useAuthStore } from '@/stores/authStore';
import { formatCurrency, getProductImage } from '@/lib/utils';
import { API_URL } from '@/lib/api';
import {
  Heart, Package, ArrowLeft, Users, Clock,
  Star, Shield, MapPin, Minus, Plus, Check,
} from 'lucide-react';

export default function ProductDetailPage() {
  const params = useParams();
  const { addToast } = useToast();
  const { token } = useAuthStore();
  
  const [product, setProduct] = useState<any>(null);
  const [existingInterest, setExistingInterest] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [quantity, setQuantity] = useState(1);
  const [maxPrice, setMaxPrice] = useState(0);
  const [timeline, setTimeline] = useState('2weeks');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Subscription State
  const [subModalOpen, setSubModalOpen] = useState(false);
  const [subQty, setSubQty] = useState(1);
  const [deliveryDay, setDeliveryDay] = useState('1');
  const [subSubmitting, setSubSubmitting] = useState(false);

  React.useEffect(() => {
    if (!token) return;
    const fetchProduct = async () => {
      try {
        const res = await fetch(`${API_URL}/consumer/products/${params.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setProduct(data.product);
          setExistingInterest(data.interest);
          setMaxPrice(data.interest ? data.interest.maxPrice : Math.round((data.product?.retailPrice || 0) * 0.75));
          if (data.interest) setSubmitted(true);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [token, params.id]);

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading product details...</div>;

  if (!product) {
    return (
      <div className={styles.notFound}>
        <Package size={48} />
        <h2>Product not found</h2>
        <Link href="/consumer/products">
          <Button variant="outline" icon={<ArrowLeft size={16} />}>Back to Products</Button>
        </Link>
      </div>
    );
  }

  const demandPercent = Math.round((product.demandCount / product.demandThreshold) * 100);
  const subPrice = Math.round(product.retailPrice * 0.7);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/consumer/interests`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          productId: params.id,
          quantity,
          maxPrice,
          timeline
        })
      });

      if (!res.ok) throw new Error('Failed to register demand');

      setSubmitted(true);
      addToast({
        type: 'success',
        title: 'Interest registered!',
        message: `You want ${quantity}× ${product.name} at max ${formatCurrency(maxPrice)}`,
      });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmSubscription = async () => {
    setSubSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/consumer/subscriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          productId: params.id,
          manufacturerId: 'm1', // Seeded manufacturer id
          monthlyQuantity: subQty,
          pricePerMonth: subPrice * subQty,
          totalDeliveries: 12
        })
      });

      if (!res.ok) throw new Error('Failed to create subscription');

      addToast({
        type: 'success',
        title: 'Subscription Created!',
        message: `Successfully subscribed to ${product.name} (Qty: ${subQty}/mo)`
      });
      setSubModalOpen(false);
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error', message: err.message });
    } finally {
      setSubSubmitting(false);
    }
  };

  const getDynamicMockImages = () => {
    return [
      getProductImage(product.image, product.name, product.id, 0),
      getProductImage(product.image, product.name, product.id, 1),
      getProductImage(product.image, product.name, product.id, 2)
    ];
  };

  const images = getDynamicMockImages();

  return (
    <div className={styles.page}>
      <Link href="/consumer/products" className={styles.backLink}>
        <ArrowLeft size={16} />
        Back to Products
      </Link>

      <div className={styles.layout}>
        {/* Left: Product Image & Info */}
        <div className={styles.leftCol}>
          <div className={styles.imageContainer} style={{ position: 'relative' }}>
            <Carousel images={images} aspectRatio="1/1" autoplay={false} />
            <Badge variant="accent" className={styles.catBadge}>{product.category}</Badge>
          </div>

          {/* Removed PriceCompare element */}
        </div>

        {/* Right: Details & Form */}
        <div className={styles.rightCol}>
          <div className={styles.tags}>
            {product.tags.map((tag: string) => (
              <Badge key={tag} variant="outline" size="sm">#{tag}</Badge>
            ))}
          </div>

          <h1 className={styles.productName}>{product.name}</h1>
          <p className={styles.productDesc}>{product.description}</p>

          <div className={styles.priceRow}>
            <span className={styles.price}>{formatCurrency(product.retailPrice)}</span>
            <span className={styles.priceLabel}>retail price per {product.unit}</span>
          </div>

          {/* Demand Progress */}
          <Card variant="glass" padding="md" className={styles.demandCard}>
            <div className={styles.demandCardInner}>
              <ProgressRing
                current={product.demandCount}
                total={product.demandThreshold}
                size={72}
                strokeWidth={6}
                variant={demandPercent >= 80 ? 'accent' : 'primary'}
              />
              <div className={styles.demandInfo}>
                <h4>{product.demandCount} of {product.demandThreshold} demanded</h4>
                <p>
                  {product.demandThreshold - product.demandCount > 0
                    ? `Need ${product.demandThreshold - product.demandCount} more to trigger auction`
                    : 'Auction threshold met! 🎉'}
                </p>
              </div>
            </div>
          </Card>

          {/* I Want This Form */}
          {!submitted ? (
            <Card variant="bordered" padding="lg" className={styles.formCard}>
              <h3 className={styles.formTitle}>
                <Heart size={20} style={{ color: 'var(--primary)' }} />
                I Want This!
              </h3>

              <div className={styles.formFields}>
                <div className={styles.field}>
                  <label className="label">Quantity ({product.unit})</label>
                  <div className={styles.quantityControl}>
                    <button
                      className={styles.qtyBtn}
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                      <Minus size={16} />
                    </button>
                    <span className={styles.qtyValue}>{quantity}</span>
                    <button
                      className={styles.qtyBtn}
                      onClick={() => setQuantity(quantity + 1)}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                <div className={styles.field}>
                  <label className="label">Max Price per {product.unit}</label>
                  <input
                    type="range"
                    min={Math.round(product.retailPrice * 0.4)}
                    max={product.retailPrice}
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className={styles.rangeInput}
                  />
                  <div className={styles.rangeLabels}>
                    <span>{formatCurrency(Math.round(product.retailPrice * 0.4))}</span>
                    <span className={styles.rangeValue}>{formatCurrency(maxPrice)}</span>
                    <span>{formatCurrency(product.retailPrice)}</span>
                  </div>
                </div>

                <div className={styles.field}>
                  <label className="label">Preferred Timeline</label>
                  <div className={styles.timelineOptions}>
                    {[
                      { value: 'urgent', label: 'ASAP' },
                      { value: '1week', label: '1 Week' },
                      { value: '2weeks', label: '2 Weeks' },
                      { value: '1month', label: '1 Month' },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        className={`${styles.timelineBtn} ${timeline === opt.value ? styles.timelineActive : ''}`}
                        onClick={() => setTimeline(opt.value)}
                        type="button"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <Button fullWidth size="lg" icon={<Heart size={18} />} onClick={handleSubmit} loading={submitting}>
                Register My Demand
              </Button>
            </Card>
          ) : (
            <Card variant="bordered" padding="lg" className={styles.successCard}>
              <div className={styles.successIcon}>
                <Check size={32} />
              </div>
              <h3>Demand Registered! 🎉</h3>
              <p>We&apos;ll notify you when the auction starts for this product.</p>
              <Link href="/consumer/interests">
                <Button variant="outline">View My Interests</Button>
              </Link>
            </Card>
          )}

          {/* Subscription Offer */}
          <Card variant="bordered" padding="lg" style={{ marginTop: '1.5rem', border: '1px solid var(--primary-glow)' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontWeight: 700, fontSize: 'var(--text-lg)' }}>
              <Clock size={20} style={{ color: 'var(--primary)' }} />
              Subscribe & Save 30%
            </h3>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Need this product regularly? Subscribe for 1 year and get a guaranteed 30% discount with monthly delivery.
            </p>
            <Button variant="outline" fullWidth onClick={() => setSubModalOpen(true)}>
              Subscribe for 1 Year
            </Button>
          </Card>
        </div>
      </div>

      {/* Subscription Modal */}
      {subModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <Card variant="default" padding="lg" style={{
            maxWidth: '480px',
            width: '100%',
            position: 'relative',
            boxShadow: 'var(--shadow-xl)',
            border: '1px solid var(--border-default)',
            background: 'var(--bg-body)',
            animation: 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}>
            <h3 style={{ fontSize: 'var(--text-xl)', marginBottom: '1rem', fontWeight: 700 }}>
              Configure Subscription
            </h3>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Subscribe to <strong>{product.name}</strong> for 12 months.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2rem' }}>
              {/* Monthly Quantity */}
              <div>
                <label className="label">Monthly Quantity ({product.unit})</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                  <button
                    className={styles.qtyBtn}
                    onClick={() => setSubQty(Math.max(1, subQty - 1))}
                  >
                    <Minus size={16} />
                  </button>
                  <span style={{ fontSize: 'var(--text-lg)', fontWeight: 600, minWidth: '24px', textAlign: 'center' }}>{subQty}</span>
                  <button
                    className={styles.qtyBtn}
                    onClick={() => setSubQty(subQty + 1)}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              {/* Delivery Day selection */}
              <div>
                <label className="label">Preferred Delivery Day</label>
                <select
                  value={deliveryDay}
                  onChange={(e) => setDeliveryDay(e.target.value)}
                  className="input"
                  style={{ marginTop: '0.5rem' }}
                >
                  <option value="1">1st of the month</option>
                  <option value="5">5th of the month</option>
                  <option value="10">10th of the month</option>
                  <option value="15">15th of the month</option>
                  <option value="20">20th of the month</option>
                  <option value="25">25th of the month</option>
                </select>
              </div>

              {/* Pricing breakdown */}
              <div style={{
                backgroundColor: 'var(--bg-elevated)',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-default)',
                marginTop: '0.5rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>Retail Price:</span>
                  <span style={{ fontSize: 'var(--text-sm)', textDecoration: 'line-through' }}>
                    {formatCurrency(product.retailPrice * subQty)}/mo
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>Subscription Price:</span>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--success)' }}>
                    {formatCurrency(subPrice * subQty)}/mo (30% off)
                  </span>
                </div>
                <div style={{ borderTop: '1px solid var(--border-default)', paddingTop: '0.5rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>Total (12 months):</span>
                  <span style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--primary)' }}>
                    {formatCurrency(subPrice * subQty * 12)}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <Button
                variant="outline"
                fullWidth
                onClick={() => setSubModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                fullWidth
                loading={subSubmitting}
                onClick={handleConfirmSubscription}
              >
                Confirm
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

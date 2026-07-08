'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import styles from './page.module.css';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import Carousel from '@/components/ui/Carousel';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { API_URL } from '@/lib/api';
import {
  Zap, ArrowRight, Users, TrendingDown,
  Shield, Clock, BarChart3, Heart,
  Package, ChevronRight, Flame,
} from 'lucide-react';
import { SkeletonProductGrid, SkeletonCarousel, SkeletonStats, SkeletonSteps, SkeletonValueProps, SkeletonText, Skeleton } from '@/components/ui/Skeleton';

interface Product {
  id: string;
  name: string;
  category: string;
  retailPrice: number;
  demandCount: number;
  demandThreshold: number;
}

interface FlashEvent {
  currentUnits: number;
}

interface Stats {
  totalSaved: number;
  activeConsumers: number;
}

interface LandingData {
  products: Product[];
  flashEvents: FlashEvent[];
  stats: Stats;
}

async function fetchLanding(): Promise<LandingData> {
  const res = await fetch(`${API_URL}/public/landing`);
  if (!res.ok) throw new Error('Failed to fetch landing data');
  return res.json();
}

export default function LandingPage() {
  const [tickerIndex, setTickerIndex] = useState(0);
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['landing'],
    queryFn: fetchLanding,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!data?.products.length) return;
    const interval = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % data.products.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [data?.products]);

  if (isLoading) {
    return (
      <div className={styles.page}>
        <Navbar />
        <section className={styles.hero} id="hero" aria-label="Loading hero section">
          <div className={styles.heroContent}>
            <SkeletonStats count={3} />
          </div>
        </section>
        <section className={styles.ticker} aria-label="Loading trending products">
          <div className={styles.tickerInner}>
            <span className={styles.tickerLabel}><Flame size={16} /> Trending Now</span>
            <div className={styles.tickerContent}>
              <div className={styles.skeleton} style={{ width: '150px', height: '1rem' }} />
              <span className={styles.tickerDot}>·</span>
              <div className={styles.skeleton} style={{ width: '120px', height: '1rem' }} />
              <span className={styles.tickerDot}>·</span>
              <div className={styles.skeleton} style={{ width: '100px', height: '1rem' }} />
            </div>
          </div>
        </section>
        <section className="container" style={{ marginTop: '2.5rem', marginBottom: '1.5rem', width: '100%', maxWidth: 'var(--max-width)' }} aria-label="Loading carousel">
          <SkeletonCarousel />
        </section>
        <section className={styles.section} id="how-it-works" aria-label="Loading how it works">
          <div className={styles.sectionInner}>
            <div className={styles.sectionHeader}>
              <Skeleton className={styles.badge} style={{ width: '100px' }} />
              <SkeletonText lines={1} className={styles.sectionTitle} />
              <SkeletonText lines={2} className={styles.sectionDesc} />
            </div>
            <SkeletonSteps />
          </div>
        </section>
        <section className={styles.section} style={{ background: 'var(--bg-dark)' }} id="products" aria-label="Loading products">
          <div className={styles.sectionInner}>
            <div className={styles.sectionHeader}>
              <Skeleton className={styles.badge} style={{ width: '140px' }} />
              <SkeletonText lines={1} className={styles.sectionTitle} />
            </div>
            <SkeletonProductGrid count={6} />
          </div>
        </section>
        <section className={styles.section} id="why-demandly" aria-label="Loading value propositions">
          <div className={styles.sectionInner}>
            <div className={styles.sectionHeader}>
              <Skeleton className={styles.badge} style={{ width: '120px' }} />
              <SkeletonText lines={1} className={styles.sectionTitle} />
            </div>
            <SkeletonValueProps />
          </div>
        </section>
        <section className={styles.ctaSection} aria-label="Loading CTA">
          <div className={styles.ctaInner}>
            <SkeletonText lines={1} className={styles.ctaTitle} />
            <SkeletonText lines={2} className={styles.ctaDesc} />
            <div className={styles.ctaActions}>
              <Skeleton className={styles.button} style={{ width: '200px', height: '48px' }} />
              <Skeleton className={styles.button} style={{ width: '220px', height: '48px' }} />
            </div>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <Navbar />
        <div style={{ padding: '3rem', textAlign: 'center', maxWidth: '600px', margin: '2rem auto' }}>
          <h2 style={{ marginBottom: '1rem', color: 'var(--danger)' }}>Failed to load data</h2>
          <p style={{ marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
            Please try refreshing the page or check your connection.
          </p>
          <Button onClick={() => window.location.reload()}>Refresh Page</Button>
        </div>
        <Footer />
      </div>
    );
  }

  const products = data?.products || [];
  const currentProduct = products[tickerIndex] || { name: 'Loading...', demandCount: 0, demandThreshold: 1, retailPrice: 1 };

  return (
    <div className={styles.page}>
      <Navbar />

      {/* Hero Section */}
      <section className={styles.hero} id="hero" aria-labelledby="hero-title">
        <div className={styles.heroContent}>
          <Badge variant="secondary" dot pulse aria-live="polite">
            🔥 {formatNumber(data?.flashEvents[0]?.currentUnits || 0)} people just joined a flash deal
          </Badge>
          <h1 id="hero-title" className={styles.heroTitle}>
            Stop Overpaying.{' '}
            <span className="gradient-text">Start Demanding.</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Unite with thousands of consumers. Aggregate demand. Let manufacturers
            compete to give you the <strong>best price</strong> — saving up to{' '}
            <span className={styles.highlight}>40% on everyday products</span>.
          </p>
          <div className={styles.heroCTA}>
            <Link href="/register">
              <Button size="lg" icon={<Zap size={20} />}>
                Start Saving Today
              </Button>
            </Link>
            <Link href="/consumer/products">
              <Button variant="outline" size="lg" iconRight={<ArrowRight size={18} />}>
                Browse Products
              </Button>
            </Link>
          </div>
          <div className={styles.heroStats} role="list" aria-label="Platform statistics">
            <div className={styles.heroStat} role="listitem">
              <span className={styles.heroStatValue}>12K+</span>
              <span className={styles.heroStatLabel}>Active Consumers</span>
            </div>
            <div className={styles.heroStatDivider} aria-hidden="true" />
            <div className={styles.heroStat} role="listitem">
              <span className={styles.heroStatValue}>₹24L+</span>
              <span className={styles.heroStatLabel}>Total Saved</span>
            </div>
            <div className={styles.heroStatDivider} aria-hidden="true" />
            <div className={styles.heroStat} role="listitem">
              <span className={styles.heroStatValue}>150+</span>
              <span className={styles.heroStatLabel}>Manufacturers</span>
            </div>
          </div>
        </div>
      </section>

      {/* Live Demand Ticker */}
      <section className={styles.ticker} aria-label="Trending products ticker">
        <div className={styles.tickerInner}>
          <span className={styles.tickerLabel} aria-hidden="true">
            <Flame size={16} /> Trending Now
          </span>
          <div className={styles.tickerContent} aria-live="polite" aria-atomic="true">
            <span className={styles.tickerProduct}>{currentProduct.name}</span>
            <span className={styles.tickerDot} aria-hidden="true">·</span>
            <span className={styles.tickerDemand}>
              {currentProduct.demandCount}/{currentProduct.demandThreshold} demanded
            </span>
            <span className={styles.tickerDot} aria-hidden="true">·</span>
            <span className={styles.tickerSaving}>
              Save up to {Math.round(((currentProduct.retailPrice - (currentProduct.retailPrice * 0.6)) / currentProduct.retailPrice) * 100)}%
            </span>
          </div>
        </div>
      </section>

      {/* Hero Promo Carousel */}
      <section className="container" style={{ marginTop: '2.5rem', marginBottom: '1.5rem', width: '100%', maxWidth: 'var(--max-width)' }} aria-label="Featured deals carousel">
        <Carousel
          images={[
            '/images/groceries-deal.svg',
            '/images/essentials-clothing-deal.svg',
            '/images/healthcare-medicines-deal.svg'
          ]}
          autoplay={true}
          aspectRatio="21/9"
        />
      </section>

      {/* How It Works */}
      <section className={styles.section} id="how-it-works" aria-labelledby="how-it-works-title">
        <div className={styles.sectionInner}>
          <div className={styles.sectionHeader}>
            <Badge variant="primary">How It Works</Badge>
            <h2 id="how-it-works-title" className={styles.sectionTitle}>
              Three steps to <span className="gradient-text">better prices</span>
            </h2>
            <p className={styles.sectionDesc}>
              Demandly flips the script on traditional eCommerce. Instead of searching for deals,
              you create demand — and deals come to you.
            </p>
          </div>

          <div className={styles.steps} role="list" aria-label="Three step process">
            <div className={styles.step} role="listitem">
              <div className={styles.stepNumber} aria-hidden="true">1</div>
              <div className={styles.stepIcon} aria-hidden="true">
                <Heart size={28} />
              </div>
              <h3 className={styles.stepTitle}>Say &quot;I Want This&quot;</h3>
              <p className={styles.stepDesc}>
                Browse products and register your interest. Tell us what you want, how much, and your max price.
              </p>
            </div>
            <div className={styles.stepArrow} aria-hidden="true">
              <ChevronRight size={24} />
            </div>
            <div className={styles.step} role="listitem">
              <div className={styles.stepNumber} aria-hidden="true">2</div>
              <div className={styles.stepIcon} aria-hidden="true">
                <Users size={28} />
              </div>
              <h3 className={styles.stepTitle}>Demand Aggregates</h3>
              <p className={styles.stepDesc}>
                When enough people want the same product, we pool the demand and open a reverse auction.
              </p>
            </div>
            <div className={styles.stepArrow} aria-hidden="true">
              <ChevronRight size={24} />
            </div>
            <div className={styles.step} role="listitem">
              <div className={styles.stepNumber} aria-hidden="true">3</div>
              <div className={styles.stepIcon} aria-hidden="true">
                <TrendingDown size={28} />
              </div>
              <h3 className={styles.stepTitle}>Prices Drop</h3>
              <p className={styles.stepDesc}>
                Manufacturers compete to win your bulk order. The best price wins — and you save big.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className={styles.section} style={{ background: 'var(--bg-dark)' }} id="products" aria-labelledby="products-title">
        <div className={styles.sectionInner}>
          <div className={styles.sectionHeader}>
            <Badge variant="secondary">Trending Products</Badge>
            <h2 id="products-title" className={styles.sectionTitle}>
              What people are <span className="gradient-text-secondary">demanding</span>
            </h2>
          </div>

          <div className={styles.productGrid} role="list" aria-label="Trending products">
            {products.slice(0, 6).map((product: Product) => (
              <Link href={`/consumer/products/${product.id}`} key={product.id} className={styles.productCardLink}>
                <Card variant="glass" padding="none" className={styles.productCard}>
                  <div className={styles.productImage}>
                    <div className={styles.productImagePlaceholder} aria-hidden="true">
                      <Package size={32} />
                    </div>
                    <Badge variant="accent" size="sm" className={styles.productCategoryBadge}>
                      {product.category}
                    </Badge>
                  </div>
                  <div className={styles.productInfo}>
                    <h3 className={styles.productName}>{product.name}</h3>
                    <div className={styles.productPrices}>
                      <span className={styles.productRetail}>{formatCurrency(product.retailPrice)}</span>
                      <Badge variant="secondary" size="sm">
                        <TrendingDown size={10} aria-hidden="true" />
                        Save up to 35%
                      </Badge>
                    </div>
                    <div className={styles.productDemand}>
                      <div className={styles.demandBarTrack} role="progressbar" aria-valuenow={Math.min(100, (product.demandCount / product.demandThreshold) * 100)} aria-valuemin={0} aria-valuemax={100} aria-label={`Demand progress: ${product.demandCount} of ${product.demandThreshold}`}>
                        <div
                          className={styles.demandBarFill}
                          style={{ width: `${Math.min(100, (product.demandCount / product.demandThreshold) * 100)}%` }}
                        />
                      </div>
                      <span className={styles.demandText}>
                        {product.demandCount}/{product.demandThreshold} interested
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>

          <div className={styles.sectionCTA}>
            <Link href="/consumer/products">
              <Button variant="outline" size="lg" iconRight={<ArrowRight size={18} />}>
                View All Products
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className={styles.section} id="why-demandly" aria-labelledby="why-demandly-title">
        <div className={styles.sectionInner}>
          <div className={styles.sectionHeader}>
            <Badge variant="primary">Why Demandly?</Badge>
            <h2 id="why-demandly-title" className={styles.sectionTitle}>
              Built for the <span className="gradient-text">smart consumer</span>
            </h2>
          </div>

          <div className={styles.valueGrid} role="list" aria-label="Value propositions">
            <Card variant="gradient" padding="lg" className={styles.valueCard} role="listitem">
              <div className={styles.valueIcon} style={{ background: 'hsla(252, 85%, 60%, 0.12)' }} aria-hidden="true">
                <TrendingDown size={24} style={{ color: 'var(--primary)' }} />
              </div>
              <h3 className={styles.valueTitle}>Save 20-40%</h3>
              <p className={styles.valueDesc}>
                Bulk demand means manufacturer pricing. No middlemen, no markups.
              </p>
            </Card>
            <Card variant="gradient" padding="lg" className={styles.valueCard} role="listitem">
              <div className={styles.valueIcon} style={{ background: 'hsla(168,76%,46%,.12)' }} aria-hidden="true">
                <Shield size={24} style={{ color: 'var(--secondary)' }} />
              </div>
              <h3 className={styles.valueTitle}>Quality Guaranteed</h3>
              <p className={styles.valueDesc}>
                Verified manufacturers with certifications. Rate and review after every order.
              </p>
            </Card>
            <Card variant="gradient" padding="lg" className={styles.valueCard} role="listitem">
              <div className={styles.valueIcon} style={{ background: 'hsla(36,100%,60%,.12)' }} aria-hidden="true">
                <Clock size={24} style={{ color: 'var(--accent)' }} />
              </div>
              <h3 className={styles.valueTitle}>Annual Subscriptions</h3>
              <p className={styles.valueDesc}>
                Lock in low prices for a full year. Monthly deliveries of essentials at wholesale rates.
              </p>
            </Card>
            <Card variant="gradient" padding="lg" className={styles.valueCard} role="listitem">
              <div className={styles.valueIcon} style={{ background: 'hsla(142,71%,45%,.12)' }} aria-hidden="true">
                <BarChart3 size={24} style={{ color: 'var(--success)' }} />
              </div>
              <h3 className={styles.valueTitle}>Price Transparency</h3>
              <p className={styles.valueDesc}>
                Compare prices across Amazon, Flipkart, and local retailers in real-time.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.ctaSection} aria-labelledby="cta-title">
        <div className={styles.ctaInner}>
          <h2 id="cta-title" className={styles.ctaTitle}>Ready to stop overpaying?</h2>
          <p className={styles.ctaDesc}>
            Join thousands of smart consumers who are saving big with collective buying power.
          </p>
          <div className={styles.ctaActions}>
            <Link href="/register">
              <Button size="lg" icon={<Zap size={20} />}>
                Create Free Account
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="ghost" size="lg">
                I already have an account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}


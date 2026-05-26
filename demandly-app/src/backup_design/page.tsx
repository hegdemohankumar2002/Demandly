'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './page.module.css';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import ProgressRing from '@/components/ui/ProgressRing';
import { formatCurrency, formatNumber } from '@/lib/utils';
import {
  Zap, ArrowRight, Users, ShoppingBag, TrendingDown,
  Shield, Clock, Star, ChevronRight, Flame,
  Package, BarChart3, Heart,
} from 'lucide-react';

export default function LandingPage() {
  const [tickerIndex, setTickerIndex] = useState(0);
  const [data, setData] = useState<any>({ products: [], flashEvents: [{ currentUnits: 0 }], stats: { totalSaved: 0, activeConsumers: 0 } });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLanding = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/public/landing');
        if (res.ok) setData(await res.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLanding();
  }, []);

  useEffect(() => {
    if (data.products.length === 0) return;
    const interval = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % data.products.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [data.products]);

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;

  const currentProduct = data.products[tickerIndex] || { name: 'Loading...', demandCount: 0, demandThreshold: 1, retailPrice: 1 };

  return (
    <div className={styles.page}>
      <Navbar />

      {/* Hero Section */}
      <section className={styles.hero} id="hero">
        <div className={styles.heroGlow} />
        <div className={styles.heroContent}>
          <Badge variant="accent" dot pulse>
            🔥 {formatNumber(data.flashEvents[0]?.currentUnits || 0)} people just joined a flash deal
          </Badge>
          <h1 className={styles.heroTitle}>
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
          <div className={styles.heroStats}>
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>12K+</span>
              <span className={styles.heroStatLabel}>Active Consumers</span>
            </div>
            <div className={styles.heroStatDivider} />
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>₹24L+</span>
              <span className={styles.heroStatLabel}>Total Saved</span>
            </div>
            <div className={styles.heroStatDivider} />
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>150+</span>
              <span className={styles.heroStatLabel}>Manufacturers</span>
            </div>
          </div>
        </div>
      </section>

      {/* Live Demand Ticker */}
      <section className={styles.ticker}>
        <div className={styles.tickerInner}>
          <span className={styles.tickerLabel}>
            <Flame size={16} /> Trending Now
          </span>
          <div className={styles.tickerContent}>
            <span className={styles.tickerProduct}>{currentProduct.name}</span>
            <span className={styles.tickerDot}>·</span>
            <span className={styles.tickerDemand}>
              {currentProduct.demandCount}/{currentProduct.demandThreshold} demanded
            </span>
            <span className={styles.tickerDot}>·</span>
            <span className={styles.tickerSaving}>
              Save up to {Math.round(((currentProduct.retailPrice - (currentProduct.retailPrice * 0.6)) / currentProduct.retailPrice) * 100)}%
            </span>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className={styles.section} id="how-it-works">
        <div className={styles.sectionInner}>
          <div className={styles.sectionHeader}>
            <Badge variant="primary">How It Works</Badge>
            <h2 className={styles.sectionTitle}>
              Three steps to <span className="gradient-text">better prices</span>
            </h2>
            <p className={styles.sectionDesc}>
              Demandly flips the script on traditional eCommerce. Instead of searching for deals,
              you create demand — and deals come to you.
            </p>
          </div>

          <div className={styles.steps}>
            <div className={styles.step}>
              <div className={styles.stepNumber}>1</div>
              <div className={styles.stepIcon}>
                <Heart size={28} />
              </div>
              <h3 className={styles.stepTitle}>Say &quot;I Want This&quot;</h3>
              <p className={styles.stepDesc}>
                Browse products and register your interest. Tell us what you want, how much, and your max price.
              </p>
            </div>
            <div className={styles.stepArrow}>
              <ChevronRight size={24} />
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>2</div>
              <div className={styles.stepIcon}>
                <Users size={28} />
              </div>
              <h3 className={styles.stepTitle}>Demand Aggregates</h3>
              <p className={styles.stepDesc}>
                When enough people want the same product, we pool the demand and open a reverse auction.
              </p>
            </div>
            <div className={styles.stepArrow}>
              <ChevronRight size={24} />
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>3</div>
              <div className={styles.stepIcon}>
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
      <section className={styles.section} style={{ background: 'var(--bg-dark)' }} id="products">
        <div className={styles.sectionInner}>
          <div className={styles.sectionHeader}>
            <Badge variant="secondary">Trending Products</Badge>
            <h2 className={styles.sectionTitle}>
              What people are <span className="gradient-text-secondary">demanding</span>
            </h2>
          </div>

          <div className={styles.productGrid}>
            {data.products.slice(0, 6).map((product: any) => (
              <Link href={`/consumer/products/${product.id}`} key={product.id} className={styles.productCardLink}>
                <Card variant="glass" padding="none" className={styles.productCard}>
                  <div className={styles.productImage}>
                    <div className={styles.productImagePlaceholder}>
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
                        <TrendingDown size={10} />
                        Save up to 35%
                      </Badge>
                    </div>
                    <div className={styles.productDemand}>
                      <div className={styles.demandBarTrack}>
                        <div
                          className={styles.demandBarFill}
                          style={{ width: `${(product.demandCount / product.demandThreshold) * 100}%` }}
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
      <section className={styles.section} id="why-demandly">
        <div className={styles.sectionInner}>
          <div className={styles.sectionHeader}>
            <Badge variant="primary">Why Demandly?</Badge>
            <h2 className={styles.sectionTitle}>
              Built for the <span className="gradient-text">smart consumer</span>
            </h2>
          </div>

          <div className={styles.valueGrid}>
            <Card variant="gradient" padding="lg" className={styles.valueCard}>
              <div className={styles.valueIcon} style={{ background: 'hsla(252, 85%, 60%, 0.12)' }}>
                <TrendingDown size={24} style={{ color: 'var(--primary)' }} />
              </div>
              <h3 className={styles.valueTitle}>Save 20-40%</h3>
              <p className={styles.valueDesc}>
                Bulk demand means manufacturer pricing. No middlemen, no markups.
              </p>
            </Card>
            <Card variant="gradient" padding="lg" className={styles.valueCard}>
              <div className={styles.valueIcon} style={{ background: 'hsla(168, 76%, 46%, 0.12)' }}>
                <Shield size={24} style={{ color: 'var(--secondary)' }} />
              </div>
              <h3 className={styles.valueTitle}>Quality Guaranteed</h3>
              <p className={styles.valueDesc}>
                Verified manufacturers with certifications. Rate and review after every order.
              </p>
            </Card>
            <Card variant="gradient" padding="lg" className={styles.valueCard}>
              <div className={styles.valueIcon} style={{ background: 'hsla(36, 100%, 60%, 0.12)' }}>
                <Clock size={24} style={{ color: 'var(--accent)' }} />
              </div>
              <h3 className={styles.valueTitle}>Annual Subscriptions</h3>
              <p className={styles.valueDesc}>
                Lock in low prices for a full year. Monthly deliveries of essentials at wholesale rates.
              </p>
            </Card>
            <Card variant="gradient" padding="lg" className={styles.valueCard}>
              <div className={styles.valueIcon} style={{ background: 'hsla(142, 71%, 45%, 0.12)' }}>
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
      <section className={styles.ctaSection}>
        <div className={styles.ctaInner}>
          <h2 className={styles.ctaTitle}>Ready to stop overpaying?</h2>
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

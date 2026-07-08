'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './Footer.module.css';
import { Zap, Globe, MessageSquare, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className={styles.footer} id="main-footer">
      <div className={styles.inner}>
        <div className={styles.grid}>
          {/* Brand */}
          <div className={styles.brand}>
            <Link href="/" className={styles.logo}>
              <Image src="/logo.png" alt="Demandly Logo" className={styles.logoImage} width={120} height={32} />
              <span className={styles.logoText}>Demandly</span>
            </Link>
            <p className={styles.tagline}>
              Reverse buying platform where consumers unite demand and manufacturers compete to offer the best price.
            </p>
            <div className={styles.socials}>
              <a href="#" className={styles.socialLink} aria-label="Website"><Globe size={18} /></a>
              <a href="#" className={styles.socialLink} aria-label="Contact"><MessageSquare size={18} /></a>
              <a href="#" className={styles.socialLink} aria-label="Email"><Mail size={18} /></a>
            </div>
          </div>

          {/* Platform */}
          <div className={styles.column}>
            <h4 className={styles.columnTitle}>Platform</h4>
            <Link href="/consumer/products" className={styles.link}>Browse Products</Link>
            <Link href="/consumer/flash-events" className={styles.link}>Flash Deals</Link>
            <Link href="/consumer/community" className={styles.link}>Community</Link>
            <Link href="/consumer/compare" className={styles.link}>Price Compare</Link>
          </div>

          {/* For Business */}
          <div className={styles.column}>
            <h4 className={styles.columnTitle}>For Manufacturers</h4>
            <Link href="/manufacturer/demand-pools" className={styles.link}>Demand Pools</Link>
            <Link href="/manufacturer/analytics" className={styles.link}>Analytics</Link>
            <Link href="/register" className={styles.link}>Register as Manufacturer</Link>
          </div>

          {/* Company */}
          <div className={styles.column}>
            <h4 className={styles.columnTitle}>Company</h4>
            <Link href="#" className={styles.link}>About Us</Link>
            <Link href="#" className={styles.link}>Privacy Policy</Link>
            <Link href="#" className={styles.link}>Terms of Service</Link>
            <Link href="#" className={styles.link}>Contact</Link>
          </div>
        </div>

        <div className={styles.bottom}>
          <p className={styles.copyright}>
            © {new Date().getFullYear()} Demandly by Vortex-IQ. All rights reserved.
          </p>
          <p className={styles.madeWith}>
            Made with ⚡ in India
          </p>
        </div>
      </div>
    </footer>
  );
}

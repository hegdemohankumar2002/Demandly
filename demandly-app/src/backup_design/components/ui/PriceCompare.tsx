'use client';

import React from 'react';
import styles from './PriceCompare.module.css';
import { cn, formatCurrency, getSavingsPercent } from '@/lib/utils';
import { TrendingDown, ExternalLink } from 'lucide-react';

interface PriceCompareProps {
  demandlyPrice: number;
  retailPrice: number;
  amazonPrice?: number;
  flipkartPrice?: number;
  compact?: boolean;
  className?: string;
}

export default function PriceCompare({
  demandlyPrice,
  retailPrice,
  amazonPrice,
  flipkartPrice,
  compact = false,
  className,
}: PriceCompareProps) {
  const savings = getSavingsPercent(retailPrice, demandlyPrice);

  const prices = [
    { label: 'Demandly', price: demandlyPrice, isBest: true },
    { label: 'Retail', price: retailPrice, isBest: false },
    ...(amazonPrice ? [{ label: 'Amazon', price: amazonPrice, isBest: false }] : []),
    ...(flipkartPrice ? [{ label: 'Flipkart', price: flipkartPrice, isBest: false }] : []),
  ].sort((a, b) => a.price - b.price);

  if (compact) {
    return (
      <div className={cn(styles.compact, className)}>
        <span className={styles.demandlyPrice}>{formatCurrency(demandlyPrice)}</span>
        <span className={styles.retailPrice}>{formatCurrency(retailPrice)}</span>
        <span className={styles.savingsBadge}>
          <TrendingDown size={12} />
          {savings}% off
        </span>
      </div>
    );
  }

  return (
    <div className={cn(styles.container, className)}>
      <div className={styles.header}>
        <h4 className={styles.title}>Price Comparison</h4>
        <span className={styles.savingsBadge}>
          <TrendingDown size={14} />
          Save {savings}%
        </span>
      </div>
      <div className={styles.bars}>
        {prices.map((item) => {
          const width = (item.price / Math.max(...prices.map((p) => p.price))) * 100;
          return (
            <div key={item.label} className={cn(styles.row, item.isBest && styles.best)}>
              <div className={styles.labelCol}>
                <span className={styles.platform}>{item.label}</span>
                <span className={styles.price}>{formatCurrency(item.price)}</span>
              </div>
              <div className={styles.barTrack}>
                <div
                  className={cn(styles.barFill, item.isBest && styles.bestBar)}
                  style={{ width: `${width}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import styles from './ProgressRing.module.css';
import { cn } from '@/lib/utils';

interface ProgressRingProps {
  current: number;
  total: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
  label?: string;
  variant?: 'primary' | 'secondary' | 'accent' | 'danger';
  className?: string;
}

export default function ProgressRing({
  current,
  total,
  size = 80,
  strokeWidth = 6,
  showLabel = true,
  label,
  variant = 'primary',
  className,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(current / total, 1);
  const offset = circumference - progress * circumference;
  const percentage = Math.round(progress * 100);

  return (
    <div className={cn(styles.wrapper, className)} style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className={styles.svg}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border-subtle)"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className={cn(styles.progress, styles[variant])}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      {showLabel && (
        <div className={styles.label}>
          <span className={styles.percentage}>{percentage}%</span>
          {label && <span className={styles.sublabel}>{label}</span>}
        </div>
      )}
    </div>
  );
}

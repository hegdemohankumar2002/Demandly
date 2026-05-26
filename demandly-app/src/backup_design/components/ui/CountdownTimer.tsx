'use client';

import React, { useState, useEffect } from 'react';
import styles from './CountdownTimer.module.css';
import { cn } from '@/lib/utils';
import { getTimeRemaining } from '@/lib/utils';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  deadline: string;
  variant?: 'default' | 'compact' | 'large';
  showIcon?: boolean;
  onExpire?: () => void;
  className?: string;
}

export default function CountdownTimer({
  deadline,
  variant = 'default',
  showIcon = true,
  onExpire,
  className,
}: CountdownTimerProps) {
  const [time, setTime] = useState(getTimeRemaining(deadline));

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = getTimeRemaining(deadline);
      setTime(remaining);
      if (remaining.isExpired) {
        clearInterval(interval);
        onExpire?.();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [deadline, onExpire]);

  const isUrgent = time.total > 0 && time.total < 3600000; // < 1 hour
  const isWarning = time.total > 0 && time.total < 86400000; // < 1 day

  if (time.isExpired) {
    return (
      <div className={cn(styles.timer, styles.expired, styles[variant], className)}>
        <span className={styles.label}>Expired</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        styles.timer,
        styles[variant],
        isUrgent && styles.urgent,
        isWarning && !isUrgent && styles.warning,
        className
      )}
    >
      {showIcon && <Clock size={variant === 'compact' ? 14 : 16} className={styles.icon} />}
      <div className={styles.segments}>
        {time.days > 0 && (
          <div className={styles.segment}>
            <span className={styles.value}>{time.days}</span>
            <span className={styles.unit}>d</span>
          </div>
        )}
        <div className={styles.segment}>
          <span className={styles.value}>{String(time.hours).padStart(2, '0')}</span>
          <span className={styles.unit}>h</span>
        </div>
        <div className={styles.segment}>
          <span className={styles.value}>{String(time.minutes).padStart(2, '0')}</span>
          <span className={styles.unit}>m</span>
        </div>
        <div className={styles.segment}>
          <span className={cn(styles.value, styles.seconds)}>{String(time.seconds).padStart(2, '0')}</span>
          <span className={styles.unit}>s</span>
        </div>
      </div>
    </div>
  );
}

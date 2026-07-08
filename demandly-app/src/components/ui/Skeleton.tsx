import styles from './Skeleton.module.css';

export function Skeleton({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`${styles.skeleton} ${className}`} {...props} />;
}

export function SkeletonText({ lines = 3, className = '', ...props }: { lines?: number; className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`${styles.skeletonText} ${className}`} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={styles.line} style={{ width: i === lines - 1 ? '60%' : '100%' }} />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = '', ...props }: { className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`${styles.skeletonCard} ${className}`} {...props}>
      <div className={styles.image} />
      <div className={styles.content}>
        <SkeletonText lines={1} className={styles.title} />
        <SkeletonText lines={2} className={styles.description} />
        <div className={styles.priceRow}>
          <Skeleton className={styles.price} />
          <Skeleton className={styles.badge} />
        </div>
        <div className={styles.demandBar}>
          <Skeleton className={styles.barTrack} />
          <Skeleton className={styles.barFill} />
        </div>
      </div>
    </div>
  );
}

export function SkeletonProductGrid({ count = 6 }: { count?: number }) {
  return (
    <div className={styles.productGrid}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonCarousel({ aspectRatio = '21/9' }: { aspectRatio?: string }) {
  return (
    <div className={styles.carousel} style={{ aspectRatio }}>
      <div className={styles.image} />
      <div className={styles.overlay}>
        <SkeletonText lines={2} className={styles.caption} />
        <Skeleton className={styles.cta} />
      </div>
    </div>
  );
}

export function SkeletonStats({ count = 3 }: { count?: number }) {
  return (
    <div className={styles.stats}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={styles.stat}>
          <Skeleton className={styles.value} />
          <SkeletonText lines={1} className={styles.label} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonSteps({ count = 3 }: { count?: number }) {
  return (
    <div className={styles.steps}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={styles.step}>
          <Skeleton className={styles.number} />
          <Skeleton className={styles.icon} />
          <SkeletonText lines={1} className={styles.title} />
          <SkeletonText lines={2} className={styles.desc} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonValueProps({ count = 4 }: { count?: number }) {
  return (
    <div className={styles.valueGrid}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={styles.valueCard}>
          <Skeleton className={styles.icon} />
          <SkeletonText lines={1} className={styles.title} />
          <SkeletonText lines={2} className={styles.desc} />
        </div>
      ))}
    </div>
  );
}
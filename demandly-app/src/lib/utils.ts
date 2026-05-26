export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

export function getTimeRemaining(deadline: string): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
  isExpired: boolean;
} {
  const total = new Date(deadline).getTime() - Date.now();
  if (total <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0, isExpired: true };
  }
  return {
    days: Math.floor(total / (1000 * 60 * 60 * 24)),
    hours: Math.floor((total / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((total / (1000 * 60)) % 60),
    seconds: Math.floor((total / 1000) % 60),
    total,
    isExpired: false,
  };
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    pending: 'var(--text-secondary)',
    aggregating: 'var(--accent)',
    threshold_met: 'var(--warning)',
    auction_active: 'var(--primary)',
    active: 'var(--secondary)',
    leading: 'var(--secondary)',
    submitted: 'var(--primary)',
    outbid: 'var(--danger)',
    won: 'var(--success)',
    lost: 'var(--danger)',
    fulfilled: 'var(--success)',
    closed: 'var(--text-tertiary)',
    cancelled: 'var(--text-tertiary)',
    paused: 'var(--warning)',
    confirmed: 'var(--primary)',
    manufacturing: 'var(--accent)',
    shipped: 'var(--secondary)',
    delivered: 'var(--success)',
    voting: 'var(--primary)',
    approved: 'var(--success)',
    in_production: 'var(--accent)',
    completed: 'var(--success)',
    expired: 'var(--text-tertiary)',
  };
  return map[status] || 'var(--text-secondary)';
}

export function getStatusLabel(status: string): string {
  return status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getSavingsPercent(retail: number, demandly: number): number {
  return Math.round(((retail - demandly) / retail) * 100);
}

export function cn(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function getRelativeTime(dateStr: string): string {
  const now = Date.now();
  const past = new Date(dateStr).getTime();
  const diff = now - past;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

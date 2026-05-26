'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Sidebar.module.css';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import {
  LayoutDashboard, ShoppingBag, Package, Heart, Gavel,
  CreditCard, Truck, Flame, Users, BarChart3,
  Factory, FileText, TrendingUp, UserCircle,
  ChevronLeft, ChevronRight, ShieldAlert
} from 'lucide-react';

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
}

const consumerLinks: NavItem[] = [
  { label: 'Dashboard', href: '/consumer/dashboard', icon: <LayoutDashboard size={20} /> },
  { label: 'Products', href: '/consumer/products', icon: <ShoppingBag size={20} /> },
  { label: 'My Interests', href: '/consumer/interests', icon: <Heart size={20} /> },
  { label: 'Auctions', href: '/consumer/auctions', icon: <Gavel size={20} />, badge: '2' },
  { label: 'Subscriptions', href: '/consumer/subscriptions', icon: <CreditCard size={20} /> },
  { label: 'Orders', href: '/consumer/orders', icon: <Truck size={20} /> },
  { label: 'Flash Deals', href: '/consumer/flash-events', icon: <Flame size={20} /> },
  { label: 'Community', href: '/consumer/community', icon: <Users size={20} /> },
  { label: 'Compare', href: '/consumer/compare', icon: <BarChart3 size={20} /> },
];

const manufacturerLinks: NavItem[] = [
  { label: 'Dashboard', href: '/manufacturer/dashboard', icon: <LayoutDashboard size={20} /> },
  { label: 'Demand Pools', href: '/manufacturer/demand-pools', icon: <Factory size={20} />, badge: '6' },
  { label: 'My Bids', href: '/manufacturer/my-bids', icon: <FileText size={20} /> },
  { label: 'Fulfilment', href: '/manufacturer/fulfilment', icon: <Truck size={20} /> },
  { label: 'Analytics', href: '/manufacturer/analytics', icon: <TrendingUp size={20} /> },
  { label: 'Profile', href: '/manufacturer/profile', icon: <UserCircle size={20} /> },
];

const adminLinks: NavItem[] = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: <LayoutDashboard size={20} /> },
  { label: 'Verifications', href: '/admin/verifications', icon: <ShieldAlert size={20} />, badge: '8' },
  { label: 'Demand Pools', href: '/admin/demand-pools', icon: <Factory size={20} /> },
  { label: 'Users', href: '/admin/users', icon: <Users size={20} /> },
  { label: 'Settings', href: '/admin/settings', icon: <UserCircle size={20} /> },
];

export default function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuthStore();

  let links = consumerLinks;
  if (user?.role === 'manufacturer') links = manufacturerLinks;
  if (user?.role === 'admin') links = adminLinks;

  return (
    <aside className={cn(styles.sidebar, collapsed && styles.collapsed)}>
      <div className={styles.inner}>
        <nav className={styles.nav}>
          {links.map((link) => {
            const isActive = pathname === link.href || pathname?.startsWith(link.href + '/');
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(styles.navItem, isActive && styles.active)}
                title={collapsed ? link.label : undefined}
              >
                <span className={styles.navIcon}>{link.icon}</span>
                {!collapsed && (
                  <>
                    <span className={styles.navLabel}>{link.label}</span>
                    {link.badge && (
                      <span className={styles.navBadge}>{link.badge}</span>
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {onToggle && (
        <button className={styles.toggle} onClick={onToggle} aria-label="Toggle sidebar">
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      )}
    </aside>
  );
}

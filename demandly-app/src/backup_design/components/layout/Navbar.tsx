'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Navbar.module.css';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import {
  Zap, Bell, User, LogOut, Menu, X,
  LayoutDashboard, ShoppingBag, ChevronDown,
} from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <nav className={styles.navbar} id="main-navbar">
      <div className={styles.inner}>
        {/* Logo */}
        <Link href="/" className={styles.logo}>
          <Zap size={24} className={styles.logoIcon} />
          <span className={styles.logoText}>Demandly</span>
        </Link>

        {/* Desktop Nav Links */}
        <div className={styles.navLinks}>
          <Link
            href="/"
            className={cn(styles.navLink, pathname === '/' && styles.active)}
          >
            Home
          </Link>
          <Link
            href="/consumer/products"
            className={cn(styles.navLink, pathname?.startsWith('/consumer/products') && styles.active)}
          >
            Products
          </Link>
          <Link
            href="/consumer/flash-events"
            className={cn(styles.navLink, pathname?.startsWith('/consumer/flash-events') && styles.active)}
          >
            Flash Deals
          </Link>
          <Link
            href="/consumer/community"
            className={cn(styles.navLink, pathname?.startsWith('/consumer/community') && styles.active)}
          >
            Community
          </Link>
        </div>

        {/* Right Section */}
        <div className={styles.actions}>
          {isAuthenticated && user ? (
            <>
              {/* Notifications */}
              <Link href={`/${user.role}/dashboard`} className={styles.iconBtn}>
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className={styles.notifBadge}>{unreadCount}</span>
                )}
              </Link>

              {/* Profile Dropdown */}
              <div className={styles.profileWrapper}>
                <button
                  className={styles.profileBtn}
                  onClick={() => setProfileOpen(!profileOpen)}
                >
                  <div className={styles.avatar}>
                    {user.name.charAt(0)}
                  </div>
                  <span className={styles.userName}>{user.name.split(' ')[0]}</span>
                  <ChevronDown size={14} />
                </button>

                {profileOpen && (
                  <div className={styles.dropdown}>
                    <div className={styles.dropdownHeader}>
                      <p className={styles.dropdownName}>{user.name}</p>
                      <p className={styles.dropdownEmail}>{user.email}</p>
                      <Badge variant={user.role === 'consumer' ? 'primary' : 'secondary'} size="sm">
                        {user.role}
                      </Badge>
                    </div>
                    <div className={styles.dropdownDivider} />
                    <Link
                      href={`/${user.role}/dashboard`}
                      className={styles.dropdownItem}
                      onClick={() => setProfileOpen(false)}
                    >
                      <LayoutDashboard size={16} />
                      Dashboard
                    </Link>
                    <Link
                      href={user.role === 'consumer' ? '/consumer/orders' : '/manufacturer/my-bids'}
                      className={styles.dropdownItem}
                      onClick={() => setProfileOpen(false)}
                    >
                      <ShoppingBag size={16} />
                      {user.role === 'consumer' ? 'My Orders' : 'My Bids'}
                    </Link>
                    <div className={styles.dropdownDivider} />
                    <button
                      className={cn(styles.dropdownItem, styles.logoutItem)}
                      onClick={() => { logout(); setProfileOpen(false); }}
                    >
                      <LogOut size={16} />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Get Started</Button>
              </Link>
            </>
          )}

          {/* Mobile Menu Toggle */}
          <button
            className={styles.mobileToggle}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className={styles.mobileMenu}>
          <Link href="/" className={styles.mobileLink} onClick={() => setMobileOpen(false)}>Home</Link>
          <Link href="/consumer/products" className={styles.mobileLink} onClick={() => setMobileOpen(false)}>Products</Link>
          <Link href="/consumer/flash-events" className={styles.mobileLink} onClick={() => setMobileOpen(false)}>Flash Deals</Link>
          <Link href="/consumer/community" className={styles.mobileLink} onClick={() => setMobileOpen(false)}>Community</Link>
          {!isAuthenticated && (
            <div className={styles.mobileActions}>
              <Link href="/login" onClick={() => setMobileOpen(false)}>
                <Button variant="outline" fullWidth>Sign In</Button>
              </Link>
              <Link href="/register" onClick={() => setMobileOpen(false)}>
                <Button fullWidth>Get Started</Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}

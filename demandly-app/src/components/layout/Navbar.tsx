'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import styles from './Navbar.module.css';
import { cn, getRelativeTime } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useTheme } from '@/context/ThemeContext';
import {
  Zap, Bell, User, LogOut, Menu, X,
  LayoutDashboard, ShoppingBag, ChevronDown,
  CheckCheck, BellOff, ExternalLink, Sun, Moon,
} from 'lucide-react';

export default function Navbar() {
  const { user, token, isAuthenticated, logout } = useAuthStore();
  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead } = useNotificationStore();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch notifications on mount and poll every 30 seconds
  useEffect(() => {
    if (!token) return;
    fetchNotifications(token);
    const interval = setInterval(() => fetchNotifications(token), 30000);
    return () => clearInterval(interval);
  }, [token, fetchNotifications]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleNotifClick = (n: any) => {
    if (!n.read) markAsRead(n.id, token || undefined);
    setNotifOpen(false);
    if (n.actionUrl) router.push(n.actionUrl);
  };

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
          <Link href="/" className={cn(styles.navLink, pathname === '/' && styles.active)}>Home</Link>
          <Link href="/consumer/products" className={cn(styles.navLink, pathname?.startsWith('/consumer/products') && styles.active)}>Products</Link>
          <Link href="/consumer/flash-events" className={cn(styles.navLink, pathname?.startsWith('/consumer/flash-events') && styles.active)}>Flash Deals</Link>
          <Link href="/consumer/community" className={cn(styles.navLink, pathname?.startsWith('/consumer/community') && styles.active)}>Community</Link>
        </div>

        {/* Right Section */}
        <div className={styles.actions}>
          {mounted && isAuthenticated && user ? (
            <>
              {/* Notifications Bell */}
              <div className={styles.notifWrapper} ref={notifRef}>
                <button className={styles.iconBtn} onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}>
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className={styles.notifBadge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
                  )}
                </button>

                {notifOpen && (
                  <div className={styles.notifDropdown}>
                    <div className={styles.notifHeader}>
                      <h3 className={styles.notifTitle}>Notifications</h3>
                      {unreadCount > 0 && (
                        <button className={styles.markAllBtn} onClick={() => markAllAsRead(token || undefined)}>
                          <CheckCheck size={14} /> Mark all read
                        </button>
                      )}
                    </div>
                    <div className={styles.notifList}>
                      {notifications.length === 0 ? (
                        <div className={styles.notifEmpty}>
                          <BellOff size={24} />
                          <p>No notifications yet</p>
                        </div>
                      ) : (
                        notifications.slice(0, 15).map((n) => (
                          <button
                            key={n.id}
                            className={cn(styles.notifItem, !n.read && styles.notifUnread)}
                            onClick={() => handleNotifClick(n)}
                          >
                            <div className={styles.notifDot} />
                            <div className={styles.notifContent}>
                              <p className={styles.notifItemTitle}>{n.title}</p>
                              <p className={styles.notifMessage}>{n.message}</p>
                              <span className={styles.notifTime}>{getRelativeTime(n.createdAt)}</span>
                            </div>
                            {n.actionUrl && <ExternalLink size={12} className={styles.notifArrow} />}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Dropdown */}
              <div className={styles.profileWrapper} ref={profileRef}>
                <button
                  className={styles.profileBtn}
                  onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
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
                      <Badge variant={user.role === 'consumer' ? 'primary' : user.role === 'admin' ? 'accent' : 'secondary'} size="sm">
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
                      href={user.role === 'consumer' ? '/consumer/orders' : user.role === 'admin' ? '/admin/settings' : '/manufacturer/my-bids'}
                      className={styles.dropdownItem}
                      onClick={() => setProfileOpen(false)}
                    >
                      <ShoppingBag size={16} />
                      {user.role === 'consumer' ? 'My Orders' : user.role === 'admin' ? 'Settings' : 'My Bids'}
                    </Link>
                    {user.role !== 'admin' && (
                      <Link
                        href={`/${user.role}/profile`}
                        className={styles.dropdownItem}
                        onClick={() => setProfileOpen(false)}
                      >
                        <User size={16} />
                        My Profile
                      </Link>
                    )}
                    <button
                      className={styles.dropdownItem}
                      onClick={() => { toggleTheme(); setProfileOpen(false); }}
                      style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                      {theme === 'dark' ? 'Light Theme' : 'Dark Theme'}
                    </button>
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
            <div className={styles.desktopActions} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button 
                onClick={toggleTheme}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem', borderRadius: 'var(--radius-full)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                aria-label="Toggle Theme"
              >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <Link href="/login">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Get Started</Button>
              </Link>
            </div>

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

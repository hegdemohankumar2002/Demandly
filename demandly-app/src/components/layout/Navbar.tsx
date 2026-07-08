'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import styles from './Navbar.module.css';
import { cn, getRelativeTime } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import type { Notification } from '@/types';
import { useNotificationStore } from '@/stores/notificationStore';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useTheme } from '@/context/ThemeContext';
import {
  Bell, User, LogOut, Menu, X,
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
  
  // Scrolled state
  const [scrolled, setScrolled] = useState(false);
  // Preview Customer Mode state
  const [isPreview, setIsPreview] = useState(false);
  
  // Scrolled dropdown state
  const [scrolledMenuOpen, setScrolledMenuOpen] = useState(false);

  // Use function initializer to avoid hydration mismatch - only true on client
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      setIsPreview(sessionStorage.getItem('preview_customer_mode') === 'true');
    }

    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const scrolledMenuRef = useRef<HTMLDivElement>(null);

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
      if (scrolledMenuRef.current && !scrolledMenuRef.current.contains(e.target as Node)) setScrolledMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleNotifClick = (n: Notification) => {
    if (!n.read) markAsRead(n.id, token || undefined);
    setNotifOpen(false);
    if (n.actionUrl) router.push(n.actionUrl);
  };

  const handleExitPreview = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('preview_customer_mode');
    }
    setIsPreview(false);
    if (user) {
      router.push(`/${user.role}/dashboard`);
    } else {
      router.push('/');
    }
  };

  // Define nav links dynamically based on role and preview state
  const getNavLinks = () => {
    if (!mounted || !isAuthenticated || !user || isPreview) {
      return [
        { label: 'Home', href: '/' },
        { label: 'Products', href: '/consumer/products', activePrefix: '/consumer/products' },
        { label: 'Flash Deals', href: '/consumer/flash-events', activePrefix: '/consumer/flash-events' },
        { label: 'Community', href: '/consumer/community', activePrefix: '/consumer/community' },
      ];
    }
    if (user.role === 'admin') {
      return [
        { label: 'Command Center', href: '/admin/dashboard', activePrefix: '/admin/dashboard' },
        { label: 'Approvals', href: '/admin/catalog-approvals', activePrefix: '/admin/catalog-approvals' },
        { label: 'Verifications', href: '/admin/verifications', activePrefix: '/admin/verifications' },
        { label: 'Users', href: '/admin/users', activePrefix: '/admin/users' },
      ];
    }
    if (user.role === 'manufacturer') {
      return [
        { label: 'Mfg Console', href: '/manufacturer/dashboard', activePrefix: '/manufacturer/dashboard' },
        { label: 'Demand Pools', href: '/manufacturer/demand-pools', activePrefix: '/manufacturer/demand-pools' },
        { label: 'My Bids', href: '/manufacturer/my-bids', activePrefix: '/manufacturer/my-bids' },
        { label: 'Propose Product', href: '/manufacturer/propose-product', activePrefix: '/manufacturer/propose-product' },
      ];
    }
    return [
      { label: 'Home', href: '/' },
      { label: 'Products', href: '/consumer/products', activePrefix: '/consumer/products' },
      { label: 'Flash Deals', href: '/consumer/flash-events', activePrefix: '/consumer/flash-events' },
      { label: 'Community', href: '/consumer/community', activePrefix: '/consumer/community' },
    ];
  };

  const navLinks = getNavLinks();

  return (
    <>
      {mounted && isPreview && (
        <div className={styles.previewBanner}>
          <span>👁️ Preview Mode: Viewing Customer Interface</span>
          <button onClick={handleExitPreview} className={styles.exitPreviewBtn}>
            Return to Console
          </button>
        </div>
      )}
      <nav 
        ref={scrolledMenuRef}
        className={cn(
          styles.navbar, 
          scrolled && styles.scrolled, 
          scrolledMenuOpen && styles.scrolledMenuOpen,
          isPreview && styles.withPreview
        )} 
        id="main-navbar"
      >
        {!scrolled ? (
          // --- FULL NAVBAR LAYOUT ---
          <div className={styles.inner}>
            <Link href="/" className={styles.logo}>
              <Image src="/media/logo.png" alt="Demandly Logo" className={styles.logoImage} width={120} height={32} style={{ width: 'auto', height: '32px' }} priority />
              <span className={styles.logoText}>Demandly</span>
            </Link>

            {/* Desktop Nav Links */}
            <div className={styles.navLinks}>
              {navLinks.map((link) => {
                const isActive = link.href === '/' ? pathname === '/' : pathname?.startsWith(link.activePrefix || link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(styles.navLink, isActive && styles.active)}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>

            {/* Right Section */}
            <div className={styles.actions}>
              {mounted ? (
                isAuthenticated && user ? (
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

                          {/* Customer Mode Switcher */}
                          {(user.role === 'admin' || user.role === 'manufacturer') && !isPreview && (
                            <button
                              className={styles.dropdownItem}
                              onClick={() => {
                                if (typeof window !== 'undefined') {
                                  sessionStorage.setItem('preview_customer_mode', 'true');
                                }
                                setProfileOpen(false);
                                setIsPreview(true);
                                router.push('/consumer/products');
                              }}
                              style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                              <ShoppingBag size={16} />
                              View Customer Site
                            </button>
                          )}

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
                      className={styles.iconBtn}
                      aria-label="Toggle Theme"
                    >
                      {mounted ? (theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />) : <Moon size={20} />}
                    </button>
                    <Link href="/login">
                      <Button variant="ghost" size="sm" style={{ color: 'rgba(255,255,255,0.75)' }}>Sign In</Button>
                    </Link>
                    <Link href="/register">
                      <Button size="sm">Get Started</Button>
                    </Link>
                  </div>
                )
              ) : (
                <div className={styles.desktopActions} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <button
                    onClick={toggleTheme}
                    className={styles.iconBtn}
                    aria-label="Toggle Theme"
                  >
                    {mounted ? (theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />) : <Moon size={20} />}
                  </button>
                  <Link href="/login">
                    <Button variant="ghost" size="sm" style={{ color: 'rgba(255,255,255,0.75)' }}>Sign In</Button>
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
        ) : (
          // --- SCROLLED PILL TRIGGER LAYOUT ---
          <div className={styles.scrolledPill} onClick={() => setScrolledMenuOpen(!scrolledMenuOpen)}>
            <div className={styles.scrolledPillLeft}>
              <span className={styles.logoTextMini}>D</span>
            </div>
            <div className={styles.scrolledPillDivider} />
            <button className={styles.scrolledPillTrigger}>
              {scrolledMenuOpen ? <X size={15} /> : <Menu size={15} />}
              <span className={styles.scrolledPillText}>Menu</span>
            </button>
            {unreadCount > 0 && (
              <span className={styles.scrolledNotifBadge}>{unreadCount}</span>
            )}
          </div>
        )}

        {/* Floating Dropdown Menu Panel (Only visible when scrolled and opened) */}
        {scrolled && scrolledMenuOpen && (
          <div className={styles.scrolledMenuDropdown}>
            <div className={styles.scrolledMenuHeader}>
              {isAuthenticated && user ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div className={styles.avatar} style={{ width: '28px', height: '28px', fontSize: '12px' }}>
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{user.name}</p>
                    <p style={{ fontSize: '10px', color: 'var(--text-tertiary)', margin: 0 }}>{user.role}</p>
                  </div>
                </div>
              ) : (
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Welcome to Demandly</span>
              )}
            </div>
            
            <div className={styles.dropdownDivider} style={{ margin: '8px 0' }} />

            {/* Navigation links inside scrolled menu */}
            <div className={styles.scrolledMenuLinks}>
              {navLinks.map((link) => {
                const isActive = link.href === '/' ? pathname === '/' : pathname?.startsWith(link.activePrefix || link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(styles.scrolledMenuLink, isActive && styles.scrolledLinkActive)}
                    onClick={() => setScrolledMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>

            <div className={styles.dropdownDivider} style={{ margin: '8px 0' }} />

            {/* Actions list inside scrolled menu */}
            <div className={styles.scrolledMenuActions}>
              {isAuthenticated && user ? (
                <>
                  <Link href={`/${user.role}/dashboard`} className={styles.scrolledMenuLink} onClick={() => setScrolledMenuOpen(false)}>
                    <LayoutDashboard size={14} style={{ marginRight: '6px' }} /> Dashboard
                  </Link>
                  
                  {/* View Customer Mode Switcher */}
                  {(user.role === 'admin' || user.role === 'manufacturer') && !isPreview && (
                    <button
                      className={styles.scrolledMenuLink}
                      onClick={() => {
                        if (typeof window !== 'undefined') {
                          sessionStorage.setItem('preview_customer_mode', 'true');
                        }
                        setScrolledMenuOpen(false);
                        setIsPreview(true);
                        router.push('/consumer/products');
                      }}
                      style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                      <ShoppingBag size={14} style={{ marginRight: '6px' }} /> View Customer Site
                    </button>
                  )}

                  <Link href={user.role === 'consumer' ? '/consumer/orders' : user.role === 'admin' ? '/admin/settings' : '/manufacturer/my-bids'} className={styles.scrolledMenuLink} onClick={() => setScrolledMenuOpen(false)}>
                    <ShoppingBag size={14} style={{ marginRight: '6px' }} /> {user.role === 'consumer' ? 'My Orders' : user.role === 'admin' ? 'Settings' : 'My Bids'}
                  </Link>

                  <button
                    className={styles.scrolledMenuLink}
                    onClick={() => { toggleTheme(); setScrolledMenuOpen(false); }}
                    style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  >
                    {theme === 'dark' ? <Sun size={14} style={{ marginRight: '6px' }} /> : <Moon size={14} style={{ marginRight: '6px' }} />}
                    {theme === 'dark' ? 'Light Theme' : 'Dark Theme'}
                  </button>

                  <div className={styles.dropdownDivider} style={{ margin: '8px 0' }} />

                  <button
                    className={cn(styles.scrolledMenuLink, styles.logoutItem)}
                    onClick={() => { logout(); setScrolledMenuOpen(false); }}
                    style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  >
                    <LogOut size={14} style={{ marginRight: '6px' }} /> Sign Out
                  </button>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '4px 8px' }}>
                  <Link href="/login" onClick={() => setScrolledMenuOpen(false)}>
                    <Button size="sm" fullWidth>Sign In</Button>
                  </Link>
                  <Link href="/register" onClick={() => setScrolledMenuOpen(false)}>
                    <Button size="sm" variant="outline" fullWidth>Get Started</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className={styles.mobileMenu}>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={styles.mobileLink}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
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
    </>
  );
}

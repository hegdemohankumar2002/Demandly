'use client';

import React, { useState } from 'react';
import styles from './manufacturer-layout.module.css';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import { useAuthStore } from '@/stores/authStore';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ManufacturerLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    } else if (user && user.role !== 'manufacturer') {
      if (user.role === 'consumer') {
        router.push('/consumer/dashboard');
      } else if (user.role === 'admin') {
        router.push('/admin/dashboard');
      }
    }
  }, [isAuthenticated, user, router]);

  return (
    <div className={styles.layout}>
      <Navbar />
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <main
        className={styles.main}
        style={{ marginLeft: collapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-width)' }}
      >
        <div className={styles.content}>
          {children}
        </div>
      </main>
    </div>
  );
}

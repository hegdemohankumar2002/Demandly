'use client';

import React, { useState, useEffect } from 'react';
import styles from './users.module.css';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { useAuthStore } from '@/stores/authStore';
import { API_URL } from '@/lib/api';
import { getRelativeTime } from '@/lib/utils';
import { Users as UsersIcon, Search, User, Building2, Shield } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'consumer' | 'manufacturer' | 'admin';
  city?: string;
  pincode?: string;
  isActive?: boolean;
  verified?: boolean;
  createdAt: string;
  _count?: {
    interests: number;
    bids: number;
  };
}

export default function UsersPage() {
  const { token } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');

  useEffect(() => {
    let cancelled = false;
    const fetchUsers = async () => {
      if (!token) {
        if (!cancelled) setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${API_URL}/admin/users`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok && !cancelled) setUsers(await res.json());
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchUsers();
    return () => { cancelled = true; };
  }, [token]);

  const filtered = users
    .filter(u => roleFilter === 'All' || u.role === roleFilter)
    .filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading users...</div>;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}><UsersIcon size={24} /> User Management</h1>
        <p className={styles.subtitle}>View and manage all platform users.</p>
      </div>

      <div className={styles.controls}>
        <div className={styles.searchBox}>
          <Search size={16} className={styles.searchIcon} />
          <input className={styles.searchInput} placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className={styles.roleFilters}>
          {['All', 'consumer', 'manufacturer', 'admin'].map(role => (
            <button key={role} className={`${styles.filterBtn} ${roleFilter === role ? styles.filterActive : ''}`} onClick={() => setRoleFilter(role)}>
              {role === 'All' ? `All (${users.length})` : `${role.charAt(0).toUpperCase() + role.slice(1)}s (${users.filter(u => u.role === role).length})`}
            </button>
          ))}
        </div>
      </div>

      <Card variant="default" padding="none">
        <table className={styles.table}>
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Location</th>
              <th>Activity</th>
              <th>Status</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(user => (
              <tr key={user.id}>
                <td>
                  <div className={styles.userCell}>
                    <div className={styles.userAvatar}>
                      {user.role === 'manufacturer' ? <Building2 size={14} /> : user.role === 'admin' ? <Shield size={14} /> : <User size={14} />}
                    </div>
                    <div>
                      <span className={styles.userName}>{user.name}</span>
                      <span className={styles.userEmail}>{user.email}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <Badge variant={user.role === 'admin' ? 'accent' : user.role === 'manufacturer' ? 'secondary' : 'primary'} size="sm">
                    {user.role}
                  </Badge>
                </td>
                <td><span className={styles.location}>{user.city || '—'}{user.pincode ? ` (${user.pincode})` : ''}</span></td>
                <td>
                  <span className={styles.activity}>
                    {(user._count?.interests ?? 0) > 0 && `${user._count?.interests} interests`}
                    {(user._count?.bids ?? 0) > 0 && ` · ${user._count?.bids} bids`}
                    {((user._count?.interests ?? 0) === 0 && (user._count?.bids ?? 0) === 0) && '—'}
                  </span>
                </td>
                <td>
                  {user.role === 'manufacturer' ? (
                    <Badge variant={user.verified ? 'success' : 'warning'} size="sm" dot>
                      {user.verified ? 'Verified' : 'Pending'}
                    </Badge>
                  ) : (
                    <Badge variant="default" size="sm">Active</Badge>
                  )}
                </td>
                <td><span className={styles.date}>{getRelativeTime(user.createdAt)}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {filtered.length === 0 && (
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>No users match your search.</p>
      )}
    </div>
  );
}

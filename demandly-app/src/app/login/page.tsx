'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './login.module.css';
import Button from '@/components/ui/Button';
import { useAuthStore, demoConsumer, demoManufacturer } from '@/stores/authStore';
import { useToast } from '@/components/ui/Toast';
import { API_URL } from '@/lib/api';
import { Zap, Mail, Lock, Eye, EyeOff, ArrowRight, Shield } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const { addToast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      addToast({ type: 'error', title: 'Error', message: 'Email and password are required' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to login');
      
      login(data.user, data.token);
      addToast({
        type: 'success',
        title: `Welcome back, ${data.user.name.split(' ')[0]}!`,
        message: `Logged in as ${data.user.role}`,
      });
      router.push(`/${data.user.role}/dashboard`);
    } catch (error: any) {
      addToast({ type: 'error', title: 'Login Failed', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.left}>
        <div className={styles.leftContent}>
          <Link href="/" className={styles.logo}>
            <Zap size={24} />
            <span>Demandly</span>
          </Link>
          <h1 className={styles.leftTitle}>
            Welcome back to{' '}
            <span className="gradient-text">collective savings</span>
          </h1>
          <p className={styles.leftDesc}>
            Sign in to track your demands, view live auctions, and keep saving.
          </p>
        </div>
      </div>

      <div className={styles.right}>
        <div className={styles.formContainer}>
          <h2 className={styles.formTitle}>Sign In</h2>
          <p className={styles.formSubtitle}>Enter your credentials to continue</p>

          <form className={styles.form} onSubmit={handleLogin}>
            <div className={styles.field}>
              <label htmlFor="email" className="label">Email</label>
              <div className={styles.inputWrapper}>
                <Mail size={18} className={styles.inputIcon} />
                <input
                  id="email"
                  type="email"
                  className="input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  style={{ paddingLeft: '42px' }}
                />
              </div>
            </div>

            <div className={styles.field}>
              <label htmlFor="password" className="label">Password</label>
              <div className={styles.inputWrapper}>
                <Lock size={18} className={styles.inputIcon} />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  style={{ paddingLeft: '42px', paddingRight: '42px' }}
                />
                <button
                  type="button"
                  className={styles.togglePassword}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <Button type="submit" fullWidth loading={loading} size="lg">
              Sign In
            </Button>
          </form>

          <p className={styles.signupLink}>
            Don&apos;t have an account?{' '}
            <Link href="/register">Create one <ArrowRight size={14} /></Link>
          </p>
        </div>
      </div>
    </div>
  );
}


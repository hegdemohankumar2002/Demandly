'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './login.module.css';
import Button from '@/components/ui/Button';
import GoogleLoginButton from '@/components/auth/GoogleLoginButton';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/components/ui/Toast';
import { API_URL } from '@/lib/api';
import { Zap, Mail, Lock, Eye, EyeOff, ArrowRight, Shield, Phone, MapPin, User, X } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const { addToast } = useToast();
  
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Google Registration State
  const [showRegModal, setShowRegModal] = useState(false);
  const [googleCredential, setGoogleCredential] = useState('');
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');
  const [regRole, setRegRole] = useState<'consumer' | 'manufacturer'>('consumer');
  const [regPhone, setRegPhone] = useState('');
  const [regPincode, setRegPincode] = useState('');
  const [regCity, setRegCity] = useState('');
  const [regLoading, setRegLoading] = useState(false);

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

  const handleGoogleSuccess = async (credential: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to authenticate with Google');

      if (data.registrationRequired) {
        setGoogleCredential(credential);
        setGoogleEmail(data.email);
        setGoogleName(data.name);
        setShowRegModal(true);
        addToast({
          type: 'info',
          title: 'Profile Incomplete',
          message: 'Please select your role and enter location details to complete registration.',
        });
      } else {
        login(data.user, data.token);
        addToast({
          type: 'success',
          title: `Welcome, ${data.user.name.split(' ')[0]}!`,
          message: `Logged in as ${data.user.role}`,
        });
        router.push(`/${data.user.role}/dashboard`);
      }
    } catch (error: any) {
      addToast({ type: 'error', title: 'Google Auth Failed', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleRegSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regPhone || !regPincode || !regCity) {
      addToast({ type: 'error', title: 'Error', message: 'All profile details are required' });
      return;
    }
    setRegLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credential: googleCredential,
          role: regRole,
          phone: regPhone,
          pincode: regPincode,
          city: regCity
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to register account');

      login(data.user, data.token);
      setShowRegModal(false);
      addToast({
        type: 'success',
        title: 'Account Created!',
        message: `Welcome to Demandly, ${data.user.name.split(' ')[0]}!`,
      });
      router.push(`/${data.user.role}/dashboard`);
    } catch (error: any) {
      addToast({ type: 'error', title: 'Registration Failed', message: error.message });
    } finally {
      setRegLoading(false);
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

          <GoogleLoginButton 
            onSuccess={handleGoogleSuccess} 
            onError={(err) => addToast({ type: 'error', title: 'Authentication Failed', message: err })} 
          />

          <p className={styles.signupLink}>
            Don&apos;t have an account?{' '}
            <Link href="/register">Create one <ArrowRight size={14} /></Link>
          </p>
        </div>
      </div>

      {/* Profile Completion Modal for Google Users */}
      {showRegModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Complete Registration</h3>
              <button type="button" className={styles.closeBtn} onClick={() => setShowRegModal(false)}>
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleRegSubmit} className={styles.modalBody}>
              <p>
                Hi <strong>{googleName}</strong>! We need a few more details to set up your <strong>{googleEmail}</strong> account.
              </p>

              <div className={styles.roleSelectWrapper}>
                <span className={styles.roleSelectLabel}>Choose Account Type</span>
                <div className={styles.roleCards}>
                  <button
                    type="button"
                    className={`${styles.roleCard} ${regRole === 'consumer' ? styles.roleActive : ''}`}
                    onClick={() => setRegRole('consumer')}
                  >
                    <div className={styles.roleIcon}>🛒</div>
                    <h4>Consumer</h4>
                    <p>Demand & join auctions</p>
                  </button>
                  <button
                    type="button"
                    className={`${styles.roleCard} ${regRole === 'manufacturer' ? styles.roleActive : ''}`}
                    onClick={() => setRegRole('manufacturer')}
                  >
                    <div className={styles.roleIcon}>🏭</div>
                    <h4>Manufacturer</h4>
                    <p>Bid on demand pools</p>
                  </button>
                </div>
              </div>

              <div className={styles.regForm}>
                <div className={styles.regField}>
                  <label htmlFor="regPhone" className="label">Phone Number</label>
                  <div className={styles.inputWrapper}>
                    <Phone size={16} className={styles.inputIcon} />
                    <input
                      id="regPhone"
                      type="tel"
                      required
                      className="input"
                      placeholder="+91 98765 43210"
                      style={{ paddingLeft: '40px' }}
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div className={styles.inlineFields}>
                  <div className={styles.regField}>
                    <label htmlFor="regPincode" className="label">Pincode</label>
                    <div className={styles.inputWrapper}>
                      <MapPin size={16} className={styles.inputIcon} />
                      <input
                        id="regPincode"
                        type="text"
                        required
                        className="input"
                        placeholder="400001"
                        style={{ paddingLeft: '40px' }}
                        value={regPincode}
                        onChange={(e) => setRegPincode(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className={styles.regField}>
                    <label htmlFor="regCity" className="label">City</label>
                    <input
                      id="regCity"
                      type="text"
                      required
                      className="input"
                      placeholder="Mumbai"
                      value={regCity}
                      onChange={(e) => setRegCity(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className={styles.modalActions}>
                <Button type="button" variant="ghost" onClick={() => setShowRegModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" loading={regLoading} icon={<Zap size={16} />}>
                  Finish Registration
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

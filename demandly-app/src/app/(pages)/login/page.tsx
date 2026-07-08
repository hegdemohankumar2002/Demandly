'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import styles from './login.module.css';
import Button from '@/components/ui/Button';
import GoogleLoginButton from '@/components/auth/GoogleLoginButton';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/components/ui/Toast';
import { API_URL } from '@/lib/api';
import { Zap, Mail, Lock, Eye, EyeOff, ArrowRight, Shield, Phone, MapPin, User, X, Check } from 'lucide-react';

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

  // OTP State
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpVerifyLoading, setOtpVerifyLoading] = useState(false);

  // Login 2FA States
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [twoFactorTarget, setTwoFactorTarget] = useState('');
  const [twoFactorType, setTwoFactorType] = useState<'email' | 'phone'>('email');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);

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
      
      if (data.twoFactorRequired) {
        setTwoFactorRequired(true);
        setTwoFactorTarget(data.target);
        setTwoFactorType(data.type);
        addToast({
          type: 'info',
          title: '2-Factor Authentication',
          message: `Verification code sent to ${data.target}`
        });
      } else {
        login(data.user, data.token);
        addToast({
          type: 'success',
          title: `Welcome back, ${data.user.name.split(' ')[0]}!`,
          message: `Logged in as ${data.user.role}`,
        });
        router.push(`/${data.user.role}/dashboard`);
      }
    } catch (error: any) {
      addToast({ type: 'error', title: 'Login Failed', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyTwoFactor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!twoFactorCode || twoFactorCode.length !== 6) {
      addToast({ type: 'error', title: 'Error', message: 'Please enter a 6-digit verification code' });
      return;
    }
    setTwoFactorLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/login/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: twoFactorCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Verification failed');

      login(data.user, data.token);
      addToast({
        type: 'success',
        title: `Welcome back, ${data.user.name.split(' ')[0]}!`,
        message: `Logged in as ${data.user.role}`,
      });
      router.push(`/${data.user.role}/dashboard`);
    } catch (error: any) {
      addToast({ type: 'error', title: 'Verification Failed', message: error.message });
    } finally {
      setTwoFactorLoading(false);
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
          message: 'Please select your role and verify your phone number to complete registration.',
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

  const handleSendOtp = async () => {
    if (!regPhone) {
      addToast({ type: 'error', title: 'Error', message: 'Please enter a phone number first' });
      return;
    }
    setOtpLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: regPhone, type: 'phone' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP');

      setOtpSent(true);
      addToast({
        type: 'success',
        title: 'OTP Sent',
        message: `A 6-digit verification code has been sent to ${regPhone}`,
      });
    } catch (error: any) {
      addToast({ type: 'error', title: 'Failed to send OTP', message: error.message });
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length !== 6) {
      addToast({ type: 'error', title: 'Error', message: 'Please enter a valid 6-digit code' });
      return;
    }
    setOtpVerifyLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: regPhone, code: otpCode, type: 'phone' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Verification failed');

      setPhoneVerified(true);
      addToast({
        type: 'success',
        title: 'Phone Verified!',
        message: 'Your phone number has been verified successfully.',
      });
    } catch (error: any) {
      addToast({ type: 'error', title: 'Verification Failed', message: error.message });
    } finally {
      setOtpVerifyLoading(false);
    }
  };

  const handleRegSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regPhone || !regPincode || !regCity) {
      addToast({ type: 'error', title: 'Error', message: 'All profile details are required' });
      return;
    }
    if (!phoneVerified) {
      addToast({ type: 'error', title: 'Verification Required', message: 'Please verify your phone number first' });
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
          city: regCity,
          otpCode: otpCode
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to register account');

      login(data.user, data.token);
      setShowRegModal(false);
      
      // Reset states
      setOtpSent(false);
      setOtpCode('');
      setPhoneVerified(false);

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
            <Image src="/media/logo.png" alt="Demandly Logo" className={styles.logoImage} width={120} height={32} priority />
            <span className={styles.logoText}>Demandly</span>
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
          {twoFactorRequired ? (
            <>
              <h2 className={styles.formTitle}>Two-Factor Security</h2>
              <p className={styles.formSubtitle}>
                We sent a 6-digit verification code to{' '}
                <strong style={{ color: 'var(--text-primary)' }}>{twoFactorTarget}</strong> via{' '}
                {twoFactorType === 'phone' ? 'SMS' : 'Email'}.
              </p>

              <form className={styles.form} onSubmit={handleVerifyTwoFactor}>
                <div className={styles.field}>
                  <label htmlFor="twoFactorCode" className="label">Verification Code</label>
                  <div className={styles.inputWrapper}>
                    <Shield size={18} className={styles.inputIcon} />
                    <input
                      id="twoFactorCode"
                      type="text"
                      maxLength={6}
                      required
                      className="input"
                      placeholder="e.g. 123456"
                      style={{
                        paddingLeft: '42px',
                        letterSpacing: '4px',
                        textAlign: 'center',
                        fontWeight: 'bold',
                      }}
                      value={twoFactorCode}
                      onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                    />
                  </div>
                </div>

                <Button type="submit" fullWidth loading={twoFactorLoading} size="lg">
                  Verify &amp; Sign In
                </Button>

                <button
                  type="button"
                  className={styles.adminBtn}
                  onClick={() => {
                    setTwoFactorRequired(false);
                    setTwoFactorCode('');
                  }}
                >
                  Back to Sign In
                </button>
              </form>
            </>
          ) : (
            <>
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

              <div style={{ textAlign: 'center', marginTop: '16px', marginBottom: '8px' }}>
                <Link href="/forgot-credentials" style={{ fontSize: '13px', color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 500 }} className={styles.adminBtn}>
                  Forgot credentials (username/password)?
                </Link>
              </div>

              <GoogleLoginButton 
                onSuccess={handleGoogleSuccess} 
                onError={(err) => addToast({ type: 'error', title: 'Authentication Failed', message: err })} 
              />

              <p className={styles.signupLink}>
                Don&apos;t have an account?{' '}
                <Link href="/register">Create one <ArrowRight size={14} /></Link>
              </p>
            </>
          )}
        </div>
      </div>

      {/* Profile Completion Modal for Google Users */}
      {showRegModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Complete Registration</h3>
              <button type="button" className={styles.closeBtn} onClick={() => {
                setShowRegModal(false);
                setOtpSent(false);
                setOtpCode('');
                setPhoneVerified(false);
              }}>
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
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div className={styles.inputWrapper} style={{ flexGrow: 1 }}>
                      <Phone size={16} className={styles.inputIcon} />
                      <input
                        id="regPhone"
                        type="tel"
                        required
                        disabled={phoneVerified}
                        className="input"
                        placeholder="+91 98765 43210"
                        style={{ paddingLeft: '40px' }}
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                      />
                    </div>
                    {!phoneVerified ? (
                      <Button
                        type="button"
                        onClick={handleSendOtp}
                        loading={otpLoading}
                        disabled={!regPhone}
                      >
                        {otpSent ? 'Resend' : 'Send OTP'}
                      </Button>
                    ) : (
                      <span style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: '#10b981',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        padding: '0 12px',
                        backgroundColor: 'rgba(16, 185, 129, 0.08)',
                        border: '1px solid #10b981',
                        borderRadius: '0.5rem'
                      }}>
                        <Check size={16} /> Verified
                      </span>
                    )}
                  </div>
                </div>

                {otpSent && !phoneVerified && (
                  <div className={styles.regField} style={{ marginTop: '8px', animation: 'fadeIn 0.2s ease-out' }}>
                    <label htmlFor="otpCode" className="label">Enter 6-Digit OTP</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        id="otpCode"
                        type="text"
                        maxLength={6}
                        required
                        className="input"
                        placeholder="e.g. 482910"
                        style={{ letterSpacing: '4px', textAlign: 'center', fontWeight: 'bold' }}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      />
                      <Button
                        type="button"
                        onClick={handleVerifyOtp}
                        loading={otpVerifyLoading}
                        disabled={otpCode.length !== 6}
                      >
                        Verify
                      </Button>
                    </div>
                  </div>
                )}

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
                <Button type="button" variant="ghost" onClick={() => {
                  setShowRegModal(false);
                  setOtpSent(false);
                  setOtpCode('');
                  setPhoneVerified(false);
                }}>
                  Cancel
                </Button>
                <Button type="submit" loading={regLoading} disabled={!phoneVerified} icon={<Zap size={16} />}>
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

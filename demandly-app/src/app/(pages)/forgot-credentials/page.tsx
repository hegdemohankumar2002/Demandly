'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from '../login/login.module.css';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { API_URL } from '@/lib/api';
import { ArrowLeft, Mail, Phone, Shield, Lock, Eye, EyeOff, Check, User } from 'lucide-react';

export default function ForgotCredentialsPage() {
  const { addToast } = useToast();
  
  // Tab state: 'username' or 'password'
  const [activeTab, setActiveTab] = useState<'username' | 'password'>('username');

  // Username recovery state
  const [phone, setPhone] = useState('');
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneOtpCode, setPhoneOtpCode] = useState('');
  const [recoveredEmails, setRecoveredEmails] = useState<string[]>([]);
  const [usernameLoading, setUsernameLoading] = useState(false);

  // Password reset state
  const [email, setEmail] = useState('');
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtpCode, setEmailOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordResetSuccess, setPasswordResetSuccess] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // --- Username (Email) Recovery Handlers ---
  const handleSendPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) {
      addToast({ type: 'error', title: 'Error', message: 'Phone number is required' });
      return;
    }
    setUsernameLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/forgot-username/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send verification code');
      
      setPhoneOtpSent(true);
      addToast({
        type: 'success',
        title: 'OTP Sent',
        message: `Verification code sent to ${phone}`,
      });
    } catch (error: any) {
      addToast({ type: 'error', title: 'Failed to Send OTP', message: error.message });
    } finally {
      setUsernameLoading(false);
    }
  };

  const handleVerifyPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneOtpCode || phoneOtpCode.length !== 6) {
      addToast({ type: 'error', title: 'Error', message: 'Please enter a valid 6-digit verification code' });
      return;
    }
    setUsernameLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/forgot-username/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code: phoneOtpCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Verification failed');

      setRecoveredEmails(data.emails || []);
      addToast({
        type: 'success',
        title: 'Verified!',
        message: 'Your account has been retrieved.',
      });
    } catch (error: any) {
      addToast({ type: 'error', title: 'Verification Failed', message: error.message });
    } finally {
      setUsernameLoading(false);
    }
  };

  // --- Password Reset Handlers ---
  const handleSendEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      addToast({ type: 'error', title: 'Error', message: 'Email address is required' });
      return;
    }
    setPasswordLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send reset code');
      
      setEmailOtpSent(true);
      addToast({
        type: 'success',
        title: 'OTP Sent',
        message: `Verification code sent to ${data.target}`,
      });
    } catch (error: any) {
      addToast({ type: 'error', title: 'Failed to Send Reset OTP', message: error.message });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOtpCode || emailOtpCode.length !== 6) {
      addToast({ type: 'error', title: 'Error', message: 'Please enter a valid 6-digit code' });
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      addToast({ type: 'error', title: 'Error', message: 'Password must be at least 6 characters' });
      return;
    }
    if (newPassword !== confirmPassword) {
      addToast({ type: 'error', title: 'Error', message: 'Passwords do not match' });
      return;
    }
    setPasswordLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: emailOtpCode, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset password');

      setPasswordResetSuccess(true);
      addToast({
        type: 'success',
        title: 'Success!',
        message: 'Your password has been updated. You can now login.',
      });
    } catch (error: any) {
      addToast({ type: 'error', title: 'Reset Failed', message: error.message });
    } finally {
      setPasswordLoading(false);
    }
  };

  const resetAllStates = () => {
    setPhone('');
    setPhoneOtpSent(false);
    setPhoneOtpCode('');
    setRecoveredEmails([]);
    
    setEmail('');
    setEmailOtpSent(false);
    setEmailOtpCode('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordResetSuccess(false);
  };

  return (
    <div className={styles.page}>
      {/* Left side info panel */}
      <div className={styles.left}>
        <div className={styles.leftContent}>
          <Link href="/" className={styles.logo}>
            <Image src="/media/logo.png" alt="Demandly Logo" className={styles.logoImage} width={120} height={32} priority />
            <span className={styles.logoText}>Demandly</span>
          </Link>
          <h1 className={styles.leftTitle}>
            Recover your{' '}
            <span className="gradient-text">credentials</span>
          </h1>
          <p className={styles.leftDesc}>
            Don&apos;t worry, it happens to the best of us. Let&apos;s get you back into your account securely.
          </p>
        </div>
      </div>

      {/* Right side forms */}
      <div className={styles.right}>
        <div className={styles.formContainer}>
          <Link href="/login" className={styles.adminBtn} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '24px', textDecoration: 'none', color: 'var(--text-secondary)' }}>
            <ArrowLeft size={16} /> Back to Sign In
          </Link>

          {/* Tab buttons */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-default)', marginBottom: '24px' }}>
            <button
              onClick={() => { setActiveTab('username'); resetAllStates(); }}
              style={{
                flex: 1,
                padding: '12px',
                textAlign: 'center',
                fontWeight: 600,
                color: activeTab === 'username' ? 'var(--primary)' : 'var(--text-secondary)',
                borderBottom: activeTab === 'username' ? '2px solid var(--primary)' : 'none',
                background: 'none',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Forgot Email
            </button>
            <button
              onClick={() => { setActiveTab('password'); resetAllStates(); }}
              style={{
                flex: 1,
                padding: '12px',
                textAlign: 'center',
                fontWeight: 600,
                color: activeTab === 'password' ? 'var(--primary)' : 'var(--text-secondary)',
                borderBottom: activeTab === 'password' ? '2px solid var(--primary)' : 'none',
                background: 'none',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Forgot Password
            </button>
          </div>

          {/* TAB 1: Forgot Username (Email) */}
          {activeTab === 'username' && (
            <>
              {recoveredEmails.length > 0 ? (
                <div style={{ animation: 'fadeIn 0.25s ease' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Check size={24} />
                    </div>
                  </div>
                  <h2 className={styles.formTitle} style={{ textAlign: 'center' }}>Account Found!</h2>
                  <p className={styles.formSubtitle} style={{ textAlign: 'center' }}>
                    We found the following email address(es) registered with your phone number:
                  </p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                    {recoveredEmails.map((email, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '12px 16px',
                          background: 'var(--bg-elevated)',
                          border: '1px solid var(--border-default)',
                          borderRadius: '8px',
                          fontWeight: 600,
                          fontSize: '15px'
                        }}
                      >
                        <User size={16} style={{ color: 'var(--primary)' }} />
                        <span>{email}</span>
                      </div>
                    ))}
                  </div>

                  <Link href="/login">
                    <Button fullWidth size="lg">Sign In Now</Button>
                  </Link>
                </div>
              ) : !phoneOtpSent ? (
                <form className={styles.form} onSubmit={handleSendPhoneOtp}>
                  <h2 className={styles.formTitle}>Find Your Email</h2>
                  <p className={styles.formSubtitle}>Enter your registered mobile number to locate your account.</p>

                  <div className={styles.field}>
                    <label htmlFor="phone" className="label">Phone Number</label>
                    <div className={styles.inputWrapper}>
                      <Phone size={18} className={styles.inputIcon} />
                      <input
                        id="phone"
                        type="tel"
                        required
                        className="input"
                        placeholder="+91 98765 43210"
                        style={{ paddingLeft: '42px' }}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                  </div>

                  <Button type="submit" fullWidth loading={usernameLoading} size="lg">
                    Send Verification Code
                  </Button>
                </form>
              ) : (
                <form className={styles.form} onSubmit={handleVerifyPhoneOtp}>
                  <h2 className={styles.formTitle}>Enter Verification Code</h2>
                  <p className={styles.formSubtitle}>We sent a 6-digit OTP code to {phone}.</p>

                  <div className={styles.field}>
                    <label htmlFor="phoneOtp" className="label">Verification Code</label>
                    <div className={styles.inputWrapper}>
                      <Shield size={18} className={styles.inputIcon} />
                      <input
                        id="phoneOtp"
                        type="text"
                        maxLength={6}
                        required
                        className="input"
                        placeholder="e.g. 123456"
                        style={{ paddingLeft: '42px', letterSpacing: '4px', textAlign: 'center', fontWeight: 'bold' }}
                        value={phoneOtpCode}
                        onChange={(e) => setPhoneOtpCode(e.target.value.replace(/\D/g, ''))}
                      />
                    </div>
                  </div>

                  <Button type="submit" fullWidth loading={usernameLoading} size="lg">
                    Verify &amp; Recover Email
                  </Button>
                </form>
              )}
            </>
          )}

          {/* TAB 2: Forgot Password */}
          {activeTab === 'password' && (
            <>
              {passwordResetSuccess ? (
                <div style={{ animation: 'fadeIn 0.25s ease' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Check size={24} />
                    </div>
                  </div>
                  <h2 className={styles.formTitle} style={{ textAlign: 'center' }}>Password Reset!</h2>
                  <p className={styles.formSubtitle} style={{ textAlign: 'center', marginBottom: '24px' }}>
                    Your password has been successfully reset. You can now log in using your new credentials.
                  </p>
                  <Link href="/login">
                    <Button fullWidth size="lg">Sign In Now</Button>
                  </Link>
                </div>
              ) : !emailOtpSent ? (
                <form className={styles.form} onSubmit={handleSendEmailOtp}>
                  <h2 className={styles.formTitle}>Reset Password</h2>
                  <p className={styles.formSubtitle}>Enter your registered email address to receive a password reset code.</p>

                  <div className={styles.field}>
                    <label htmlFor="email" className="label">Email Address</label>
                    <div className={styles.inputWrapper}>
                      <Mail size={18} className={styles.inputIcon} />
                      <input
                        id="email"
                        type="email"
                        required
                        className="input"
                        placeholder="you@example.com"
                        style={{ paddingLeft: '42px' }}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <Button type="submit" fullWidth loading={passwordLoading} size="lg">
                    Send Verification Code
                  </Button>
                </form>
              ) : (
                <form className={styles.form} onSubmit={handleResetPassword}>
                  <h2 className={styles.formTitle}>Enter Details</h2>
                  <p className={styles.formSubtitle}>Set a new password for {email}.</p>

                  <div className={styles.field}>
                    <label htmlFor="emailOtp" className="label">Verification Code (OTP)</label>
                    <div className={styles.inputWrapper}>
                      <Shield size={18} className={styles.inputIcon} />
                      <input
                        id="emailOtp"
                        type="text"
                        maxLength={6}
                        required
                        className="input"
                        placeholder="e.g. 123456"
                        style={{ paddingLeft: '42px', letterSpacing: '4px', textAlign: 'center', fontWeight: 'bold' }}
                        value={emailOtpCode}
                        onChange={(e) => setEmailOtpCode(e.target.value.replace(/\D/g, ''))}
                      />
                    </div>
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="newPassword" className="label">New Password</label>
                    <div className={styles.inputWrapper}>
                      <Lock size={18} className={styles.inputIcon} />
                      <input
                        id="newPassword"
                        type={showPassword ? 'text' : 'password'}
                        required
                        className="input"
                        placeholder="Min. 6 characters"
                        style={{ paddingLeft: '42px', paddingRight: '42px' }}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        className={styles.togglePassword}
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ background: 'none', border: 'none', position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="confirmPassword" className="label">Confirm New Password</label>
                    <div className={styles.inputWrapper}>
                      <Lock size={18} className={styles.inputIcon} />
                      <input
                        id="confirmPassword"
                        type={showPassword ? 'text' : 'password'}
                        required
                        className="input"
                        placeholder="Re-enter new password"
                        style={{ paddingLeft: '42px' }}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                  </div>

                  <Button type="submit" fullWidth loading={passwordLoading} size="lg">
                    Reset Password
                  </Button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

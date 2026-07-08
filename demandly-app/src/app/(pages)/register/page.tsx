'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import styles from './register.module.css';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/components/ui/Toast';
import { API_URL } from '@/lib/api';
import { Zap, Mail, Lock, User, MapPin, Phone, ArrowLeft, ArrowRight, Check, Compass } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const { addToast } = useToast();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<'consumer' | 'manufacturer'>('consumer');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    pincode: '',
    city: ''
  });

  // OTP Verification States
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtpCode, setEmailOtpCode] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailOtpLoading, setEmailOtpLoading] = useState(false);
  const [emailOtpVerifyLoading, setEmailOtpVerifyLoading] = useState(false);

  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneOtpCode, setPhoneOtpCode] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [phoneOtpLoading, setPhoneOtpLoading] = useState(false);
  const [phoneOtpVerifyLoading, setPhoneOtpVerifyLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSendEmailOtp = async () => {
    if (!formData.email) {
      addToast({ type: 'error', title: 'Error', message: 'Please enter your email first' });
      return;
    }
    setEmailOtpLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: formData.email, type: 'email' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send email OTP');

      setEmailOtpSent(true);
      addToast({
        type: 'success',
        title: 'OTP Sent',
        message: `An OTP code has been sent to ${formData.email}`,
      });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Failed to send OTP', message: err.message });
    } finally {
      setEmailOtpLoading(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    if (!emailOtpCode || emailOtpCode.length !== 6) {
      addToast({ type: 'error', title: 'Error', message: 'Please enter a 6-digit code' });
      return;
    }
    setEmailOtpVerifyLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: formData.email, code: emailOtpCode, type: 'email' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Email verification failed');

      setEmailVerified(true);
      addToast({
        type: 'success',
        title: 'Email Verified!',
        message: 'Your email has been verified successfully.',
      });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Verification Failed', message: err.message });
    } finally {
      setEmailOtpVerifyLoading(false);
    }
  };

  const handleSendPhoneOtp = async () => {
    if (!formData.phone) {
      addToast({ type: 'error', title: 'Error', message: 'Please enter your phone number first' });
      return;
    }
    setPhoneOtpLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: formData.phone, type: 'phone' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send phone OTP');

      setPhoneOtpSent(true);
      addToast({
        type: 'success',
        title: 'OTP Sent',
        message: `An OTP code has been sent to ${formData.phone}`,
      });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Failed to send OTP', message: err.message });
    } finally {
      setPhoneOtpLoading(false);
    }
  };

  const handleVerifyPhoneOtp = async () => {
    if (!phoneOtpCode || phoneOtpCode.length !== 6) {
      addToast({ type: 'error', title: 'Error', message: 'Please enter a 6-digit code' });
      return;
    }
    setPhoneOtpVerifyLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: formData.phone, code: phoneOtpCode, type: 'phone' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Phone verification failed');

      setPhoneVerified(true);
      addToast({
        type: 'success',
        title: 'Phone Verified!',
        message: 'Your phone number has been verified successfully.',
      });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Verification Failed', message: err.message });
    } finally {
      setPhoneOtpVerifyLoading(false);
    }
  };

  const handleFetchGPSLocation = () => {
    if (!navigator.geolocation) {
      addToast({
        type: 'error',
        title: 'Not Supported',
        message: 'Geolocation is not supported by your browser.',
      });
      return;
    }

    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          if (!res.ok) throw new Error('Failed to fetch location details');
          const data = await res.json();

          const pincode = data.address?.postcode || '';
          const city =
            data.address?.city ||
            data.address?.town ||
            data.address?.village ||
            data.address?.county ||
            '';

          setFormData((prev) => ({
            ...prev,
            pincode,
            city,
          }));

          addToast({
            type: 'success',
            title: 'Location Found',
            message: `Autofilled: ${city} (${pincode})`,
          });
        } catch (err: any) {
          addToast({
            type: 'error',
            title: 'Location Error',
            message: err.message || 'Failed to resolve coordinates',
          });
        } finally {
          setGpsLoading(false);
        }
      },
      (error) => {
        addToast({
          type: 'error',
          title: 'GPS Access Denied',
          message: error.message || 'Could not fetch geolocation.',
        });
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      addToast({ type: 'error', title: 'Error', message: 'Please fill in required fields' });
      return;
    }
    if (!emailVerified) {
      addToast({ type: 'error', title: 'Verification Required', message: 'Please verify your email first' });
      return;
    }
    if (formData.phone && !phoneVerified) {
      addToast({ type: 'error', title: 'Verification Required', message: 'Please verify your phone number first' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...formData, 
          role,
          emailOtpCode,
          phoneOtpCode: formData.phone ? phoneOtpCode : undefined
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to register');
      
      login(data.user, data.token);
      addToast({
        type: 'success',
        title: 'Account created!',
        message: `Welcome to Demandly, ${data.user.name.split(' ')[0]}!`,
      });
      router.push(`/${role}/dashboard`);
    } catch (error: any) {
      addToast({ type: 'error', title: 'Registration Failed', message: error.message });
    } finally {
      setLoading(false);
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
            Join the <span className="gradient-text">buying revolution</span>
          </h1>
          <p className={styles.leftDesc}>
            Create an account and start saving through the power of collective demand.
          </p>
          <div className={styles.features}>
            <div className={styles.feature}><Check size={16} /> Save 20-40% on products</div>
            <div className={styles.feature}><Check size={16} /> Access live reverse auctions</div>
            <div className={styles.feature}><Check size={16} /> Annual subscription plans</div>
            <div className={styles.feature}><Check size={16} /> Community-driven product ideas</div>
          </div>
        </div>
      </div>

      <div className={styles.right}>
        <div className={styles.formContainer}>
          <h2 className={styles.formTitle}>Create Account</h2>

          {/* Progress Steps */}
          <div className={styles.progressBar}>
            {[1, 2, 3].map((s) => (
              <div key={s} className={`${styles.progressStep} ${step >= s ? styles.progressActive : ''}`}>
                <div className={styles.progressDot}>{step > s ? <Check size={12} /> : s}</div>
                <span className={styles.progressLabel}>
                  {s === 1 ? 'Role' : s === 2 ? 'Details' : 'Location'}
                </span>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {/* Step 1: Role Selection */}
            {step === 1 && (
              <div className={styles.stepContent}>
                <p className={styles.stepDesc}>I want to join as a:</p>
                <div className={styles.roleCards}>
                  <button
                    type="button"
                    className={`${styles.roleCard} ${role === 'consumer' ? styles.roleActive : ''}`}
                    onClick={() => setRole('consumer')}
                  >
                    <div className={styles.roleIcon}>🛒</div>
                    <h3>Consumer</h3>
                    <p>Register demand, join auctions, save money on products</p>
                  </button>
                  <button
                    type="button"
                    className={`${styles.roleCard} ${role === 'manufacturer' ? styles.roleActive : ''}`}
                    onClick={() => setRole('manufacturer')}
                  >
                    <div className={styles.roleIcon}>🏭</div>
                    <h3>Manufacturer</h3>
                    <p>Bid on demand pools, win bulk orders, grow revenue</p>
                  </button>
                </div>
                <Button fullWidth size="lg" onClick={() => setStep(2)} iconRight={<ArrowRight size={18} />}>
                  Continue
                </Button>
              </div>
            )}

            {/* Step 2: Personal Details */}
            {step === 2 && (
              <div className={styles.stepContent}>
                <div className={styles.field}>
                  <label htmlFor="name" className="label">Full Name</label>
                  <div className={styles.inputWrapper}>
                    <User size={18} className={styles.inputIcon} />
                    <input id="name" type="text" className="input" placeholder="Your full name" style={{ paddingLeft: '42px' }} value={formData.name} onChange={handleInputChange} />
                  </div>
                </div>

                <div className={styles.field}>
                  <label htmlFor="email" className="label">Email Address</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div className={styles.inputWrapper} style={{ flexGrow: 1 }}>
                      <Mail size={18} className={styles.inputIcon} />
                      <input id="email" type="email" disabled={emailVerified} className="input" placeholder="you@example.com" style={{ paddingLeft: '42px' }} value={formData.email} onChange={handleInputChange} />
                    </div>
                    {!emailVerified ? (
                      <Button type="button" onClick={handleSendEmailOtp} loading={emailOtpLoading} disabled={!formData.email}>
                        {emailOtpSent ? 'Resend' : 'Send OTP'}
                      </Button>
                    ) : (
                      <span style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: '#10b981',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        padding: '0 12px',
                        backgroundColor: 'rgba(16, 185, 129, 0.08)',
                        border: '1px solid #10b981',
                        borderRadius: '0.375rem'
                      }}>
                        <Check size={14} /> Verified
                      </span>
                    )}
                  </div>
                </div>

                {emailOtpSent && !emailVerified && (
                  <div className={styles.field} style={{ marginTop: '8px' }}>
                    <label htmlFor="emailOtpCode" className="label">Enter Email OTP</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        id="emailOtpCode"
                        type="text"
                        maxLength={6}
                        required
                        className="input"
                        placeholder="e.g. 123456"
                        style={{ letterSpacing: '4px', textAlign: 'center', fontWeight: 'bold' }}
                        value={emailOtpCode}
                        onChange={(e) => setEmailOtpCode(e.target.value.replace(/\D/g, ''))}
                      />
                      <Button type="button" onClick={handleVerifyEmailOtp} loading={emailOtpVerifyLoading} disabled={emailOtpCode.length !== 6}>
                        Verify
                      </Button>
                    </div>
                  </div>
                )}

                <div className={styles.field}>
                  <label htmlFor="phone" className="label">Phone Number</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div className={styles.inputWrapper} style={{ flexGrow: 1 }}>
                      <Phone size={18} className={styles.inputIcon} />
                      <input id="phone" type="tel" disabled={phoneVerified} className="input" placeholder="+91 98765 43210" style={{ paddingLeft: '42px' }} value={formData.phone} onChange={handleInputChange} />
                    </div>
                    {formData.phone && (
                      <>
                        {!phoneVerified ? (
                          <Button type="button" onClick={handleSendPhoneOtp} loading={phoneOtpLoading}>
                            {phoneOtpSent ? 'Resend' : 'Send OTP'}
                          </Button>
                        ) : (
                          <span style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: '#10b981',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            padding: '0 12px',
                            backgroundColor: 'rgba(16, 185, 129, 0.08)',
                            border: '1px solid #10b981',
                            borderRadius: '0.375rem'
                          }}>
                            <Check size={14} /> Verified
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {phoneOtpSent && !phoneVerified && (
                  <div className={styles.field} style={{ marginTop: '8px' }}>
                    <label htmlFor="phoneOtpCode" className="label">Enter Phone OTP</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        id="phoneOtpCode"
                        type="text"
                        maxLength={6}
                        required
                        className="input"
                        placeholder="e.g. 123456"
                        style={{ letterSpacing: '4px', textAlign: 'center', fontWeight: 'bold' }}
                        value={phoneOtpCode}
                        onChange={(e) => setPhoneOtpCode(e.target.value.replace(/\D/g, ''))}
                      />
                      <Button type="button" onClick={handleVerifyPhoneOtp} loading={phoneOtpVerifyLoading} disabled={phoneOtpCode.length !== 6}>
                        Verify
                      </Button>
                    </div>
                  </div>
                )}

                <div className={styles.field}>
                  <label htmlFor="password" className="label">Password</label>
                  <div className={styles.inputWrapper}>
                    <Lock size={18} className={styles.inputIcon} />
                    <input id="password" type="password" className="input" placeholder="Create a password" style={{ paddingLeft: '42px' }} value={formData.password} onChange={handleInputChange} />
                  </div>
                </div>

                <div className={styles.navButtons}>
                  <Button variant="ghost" onClick={() => setStep(1)} icon={<ArrowLeft size={18} />}>Back</Button>
                  <Button size="lg" onClick={() => setStep(3)} disabled={!emailVerified || (formData.phone !== '' && !phoneVerified)} iconRight={<ArrowRight size={18} />}>Continue</Button>
                </div>
              </div>
            )}

            {/* Step 3: Location */}
            {step === 3 && (
              <div className={styles.stepContent}>
                <div className={styles.field}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label htmlFor="pincode" className="label" style={{ margin: 0 }}>Pincode</label>
                    <button
                      type="button"
                      onClick={handleFetchGPSLocation}
                      disabled={gpsLoading}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'none',
                        border: 'none',
                        color: 'var(--primary)',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        padding: 0
                      }}
                    >
                      <Compass size={14} style={{ animation: gpsLoading ? 'spin 1s linear infinite' : 'none' }} />
                      {gpsLoading ? 'Locating...' : 'Use Current Location'}
                    </button>
                  </div>
                  <div className={styles.inputWrapper}>
                    <MapPin size={18} className={styles.inputIcon} />
                    <input id="pincode" type="text" className="input" placeholder="e.g. 400001" style={{ paddingLeft: '42px' }} value={formData.pincode} onChange={handleInputChange} />
                  </div>
                  <p className={styles.hint}>Used for demand clustering and local delivery matching</p>
                </div>
                <div className={styles.field}>
                  <label htmlFor="city" className="label">City</label>
                  <input id="city" type="text" className="input" placeholder="e.g. Mumbai" value={formData.city} onChange={handleInputChange} />
                </div>
                <div className={styles.navButtons}>
                  <Button variant="ghost" onClick={() => setStep(2)} icon={<ArrowLeft size={18} />}>Back</Button>
                  <Button type="submit" size="lg" loading={loading} disabled={!emailVerified || (formData.phone !== '' && !phoneVerified)} icon={<Zap size={18} />}>Create Account</Button>
                </div>
              </div>
            )}
          </form>

          <p className={styles.loginLink}>
            Already have an account?{' '}
            <Link href="/login">Sign in <ArrowRight size={14} /></Link>
          </p>
        </div>
      </div>
    </div>
  );
}

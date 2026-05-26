'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './register.module.css';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useAuthStore, demoConsumer, demoManufacturer } from '@/stores/authStore';
import { useToast } from '@/components/ui/Toast';
import { API_URL } from '@/lib/api';
import { Zap, Mail, Lock, User, MapPin, Phone, ArrowLeft, ArrowRight, Check } from 'lucide-react';

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      addToast({ type: 'error', title: 'Error', message: 'Please fill in required fields' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, role }),
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
            <Zap size={24} />
            <span>Demandly</span>
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
                  <label htmlFor="email" className="label">Email</label>
                  <div className={styles.inputWrapper}>
                    <Mail size={18} className={styles.inputIcon} />
                    <input id="email" type="email" className="input" placeholder="you@example.com" style={{ paddingLeft: '42px' }} value={formData.email} onChange={handleInputChange} />
                  </div>
                </div>
                <div className={styles.field}>
                  <label htmlFor="phone" className="label">Phone</label>
                  <div className={styles.inputWrapper}>
                    <Phone size={18} className={styles.inputIcon} />
                    <input id="phone" type="tel" className="input" placeholder="+91 98765 43210" style={{ paddingLeft: '42px' }} value={formData.phone} onChange={handleInputChange} />
                  </div>
                </div>
                <div className={styles.field}>
                  <label htmlFor="password" className="label">Password</label>
                  <div className={styles.inputWrapper}>
                    <Lock size={18} className={styles.inputIcon} />
                    <input id="password" type="password" className="input" placeholder="Create a password" style={{ paddingLeft: '42px' }} value={formData.password} onChange={handleInputChange} />
                  </div>
                </div>
                <div className={styles.navButtons}>
                  <Button variant="ghost" onClick={() => setStep(1)} icon={<ArrowLeft size={18} />}>Back</Button>
                  <Button size="lg" onClick={() => setStep(3)} iconRight={<ArrowRight size={18} />}>Continue</Button>
                </div>
              </div>
            )}

            {/* Step 3: Location */}
            {step === 3 && (
              <div className={styles.stepContent}>
                <div className={styles.field}>
                  <label htmlFor="pincode" className="label">Pincode</label>
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
                  <Button type="submit" size="lg" loading={loading} icon={<Zap size={18} />}>Create Account</Button>
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

'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Mail, Shield, Check, X, AlertCircle } from 'lucide-react';
import styles from './GoogleLoginButton.module.css';

interface GoogleLoginButtonProps {
  onSuccess: (credential: string) => void;
  onError: (error: string) => void;
}

export default function GoogleLoginButton({ onSuccess, onError }: GoogleLoginButtonProps) {
  const [useMock, setUseMock] = useState(true);
  const [showMockModal, setShowMockModal] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const btnContainerRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(false);

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

  const loadGoogleScript = useCallback(() => {
    if (window.google?.accounts?.id) {
      setTimeout(() => { if (mountedRef.current) setScriptLoaded(true); }, 0);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setTimeout(() => { if (mountedRef.current) setScriptLoaded(true); }, 0);
    };
    script.onerror = () => {
      console.warn('Failed to load Google Identity Services script. Falling back to mock mode.');
      setTimeout(() => { if (mountedRef.current) setUseMock(true); }, 0);
    };
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    if (clientId && clientId !== 'your-google-client-id') {
      setTimeout(() => { if (mountedRef.current) setUseMock(false); }, 0);
      loadGoogleScript();
    } else {
      setTimeout(() => { if (mountedRef.current) setUseMock(true); }, 0);
    }
    return () => { mountedRef.current = false; };
  }, [clientId, loadGoogleScript]);

  useEffect(() => {
    if (useMock || !scriptLoaded || !btnContainerRef.current) return;

    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response: { credential?: string }) => {
          if (response.credential) {
            onSuccess(response.credential);
          } else {
            onError('Google authentication failed');
          }
        },
      });

      window.google.accounts.id.renderButton(btnContainerRef.current, {
        theme: 'outline',
        size: 'large',
        width: 320,
        text: 'signin_with',
        shape: 'rectangular',
      });
    } catch (err: any) {
      console.error('Error initializing real Google GIS:', err);
      setTimeout(() => { if (mountedRef.current) setUseMock(true); }, 0);
    }
  }, [useMock, scriptLoaded, clientId, onSuccess, onError]);

  const handleMockSelect = (email: string) => {
    setShowMockModal(false);
    onSuccess(`mock-google-token-${email}`);
  };

  const handleCustomMockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail || !customEmail.includes('@')) {
      onError('Please enter a valid email address');
      return;
    }
    setShowMockModal(false);
    onSuccess(`mock-google-token-${customEmail}`);
  };

  if (!useMock) {
    return (
      <div className={styles.container}>
        <div className={styles.divider}>
          <span>or sign in with</span>
        </div>
        <div ref={btnContainerRef} className={styles.googleBtnWrapper}></div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.divider}>
        <span>or sign in with</span>
      </div>

      <button
        type="button"
        className={styles.mockGoogleBtn}
        onClick={() => setShowMockModal(true)}
      >
        <svg className={styles.googleIcon} viewBox="0 0 24 24" width="18" height="18">
          <path
            fill="#EA4335"
            d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.23 2.705 1.258 6.645l3.996 3.12z"
          />
          <path
            fill="#34A853"
            d="M16.04 15.345c-1.127.755-2.545 1.2-4.04 1.2a7.07 7.07 0 0 1-6.75-4.855L1.22 14.81C3.178 18.79 7.245 21.6 12 21.6c3.11 0 5.92-.99 8.01-2.68l-3.97-3.575z"
          />
          <path
            fill="#4285F4"
            d="M23.49 12.275c0-.825-.075-1.615-.215-2.385H12v4.51h6.46c-.28 1.48-1.12 2.73-2.38 3.57l3.97 3.575c2.327-2.145 3.66-5.295 3.66-8.99z"
          />
          <path
            fill="#FBBC05"
            d="M5.25 11.69A7.014 7.014 0 0 1 4.91 12c0-.525.045-1.04.13-1.545L1.045 7.33A11.96 11.96 0 0 0 0 12c0 1.69.35 3.3 1.025 4.77l4.225-3.08z"
          />
        </svg>
        <span>Sign in with Google (Sandbox)</span>
      </button>

      {/* Mock Sandbox Modal */}
      {showMockModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleWrapper}>
                <Shield className={styles.shieldIcon} size={20} />
                <h3>Google SSO Sandbox</h3>
              </div>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setShowMockModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.sandboxNotice}>
                <AlertCircle size={16} />
                <p>
                  No client credential found. Running in **OAuth Sandbox**. Select an account to simulate Google login.
                </p>
              </div>

              <p className={styles.sectionLabel}>Select a test account:</p>
              <div className={styles.mockAccountsList}>
                <button
                  type="button"
                  className={styles.mockAccountRow}
                  onClick={() => handleMockSelect('hegdemohankumar2002@gmail.com')}
                >
                  <div className={styles.avatar}>MH</div>
                  <div className={styles.accountInfo}>
                    <span className={styles.accountName}>Mohankumar Hegde</span>
                    <span className={styles.accountEmail}>hegdemohankumar2002@gmail.com</span>
                  </div>
                  <Check size={16} className={styles.checkIcon} />
                </button>

                <button
                  type="button"
                  className={styles.mockAccountRow}
                  onClick={() => handleMockSelect('testconsumer1@demo.com')}
                >
                  <div className={styles.avatar}>TC</div>
                  <div className={styles.accountInfo}>
                    <span className={styles.accountName}>Test Consumer</span>
                    <span className={styles.accountEmail}>testconsumer1@demo.com</span>
                  </div>
                  <Check size={16} className={styles.checkIcon} />
                </button>

                <button
                  type="button"
                  className={styles.mockAccountRow}
                  onClick={() => handleMockSelect('testmfg_bid@demo.com')}
                >
                  <div className={styles.avatar}>BA</div>
                  <div className={styles.accountInfo}>
                    <span className={styles.accountName}>Bidder Alpha (Mfg)</span>
                    <span className={styles.accountEmail}>testmfg_bid@demo.com</span>
                  </div>
                  <Check size={16} className={styles.checkIcon} />
                </button>
              </div>

              <div className={styles.modalDivider}>
                <span>or use a custom email</span>
              </div>

              <form onSubmit={handleCustomMockSubmit} className={styles.customEmailForm}>
                <div className={styles.inputWrapper}>
                  <Mail size={16} className={styles.mailIcon} />
                  <input
                    type="email"
                    required
                    placeholder="enter.any@email.com"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    className={styles.customInput}
                  />
                </div>
                <button type="submit" className={styles.customSubmitBtn}>
                  Simulate SSO Login
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Global declaration for window.google
declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (response: { credential?: string }) => void }) => void;
          renderButton: (element: HTMLElement, options: { theme: string; size: string; width: number; text: string; shape: string }) => void;
        };
      };
    };
  }
}

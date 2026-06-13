'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlertTriangle, RefreshCw, ShoppingBag } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

function PaymentFailedContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId') || 'unknown';
  const errorMsg = searchParams.get('error') || 'The transaction was declined by your bank.';

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      backgroundColor: 'var(--bg-body)',
      fontFamily: 'var(--font-body)',
    }}>
      <Card variant="default" padding="lg" style={{
        maxWidth: '480px',
        width: '100%',
        textAlign: 'center',
        background: 'var(--bg-surface)',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--border-default)',
        animation: 'scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '72px',
          height: '72px',
          borderRadius: 'var(--radius-full)',
          backgroundColor: 'hsla(0, 60%, 50%, 0.1)',
          color: 'var(--danger)',
          marginBottom: '1.5rem',
        }}>
          <AlertTriangle size={44} />
        </div>

        <h1 style={{
          fontSize: 'var(--text-2xl)',
          color: 'var(--text-primary)',
          fontWeight: 700,
          marginBottom: '0.75rem',
          letterSpacing: '-0.02em',
        }}>
          Payment Failed
        </h1>
        
        <p style={{
          fontSize: 'var(--text-base)',
          color: 'var(--text-secondary)',
          marginBottom: '2rem',
        }}>
          We couldn't process your payment. Don't worry, no funds were debited.
        </p>

        <div style={{
          backgroundColor: 'var(--bg-elevated)',
          padding: '1rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-default)',
          marginBottom: '2rem',
          textAlign: 'left',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>Order ID:</span>
            <span style={{ fontWeight: '600', fontSize: 'var(--text-sm)' }}>{orderId}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>Reason:</span>
            <span style={{ fontWeight: '500', fontSize: 'var(--text-sm)', color: 'var(--danger)' }}>
              {errorMsg}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Link href="/consumer/orders" passHref legacyBehavior>
            <Button variant="primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', width: '100%', justifyContent: 'center' }}>
              <RefreshCw size={18} />
              Try Again
            </Button>
          </Link>
          <Link href="/consumer/dashboard" passHref legacyBehavior>
            <Button variant="ghost" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', width: '100%', justifyContent: 'center' }}>
              <ShoppingBag size={18} />
              Go to Dashboard
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}

export default function PaymentFailedPage() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading payment failure details...</div>}>
      <PaymentFailedContent />
    </Suspense>
  );
}

'use client';

import React from 'react';
import Link from 'next/link';
import { HelpCircle, ArrowLeft } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function NotFound() {
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
      <div style={{
        maxWidth: '480px',
        width: '100%',
        textAlign: 'center',
        padding: '3rem 2rem',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--bg-surface)',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--border-default)',
        animation: 'fadeInUp 0.6s ease-out',
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '80px',
          height: '80px',
          borderRadius: 'var(--radius-full)',
          backgroundColor: 'var(--primary-glow)',
          color: 'var(--primary)',
          marginBottom: '2rem',
        }}>
          <HelpCircle size={48} />
        </div>
        
        <h1 style={{
          fontSize: 'var(--text-4xl)',
          color: 'var(--text-primary)',
          marginBottom: '1rem',
          fontWeight: 800,
        }}>404</h1>
        
        <h2 style={{
          fontSize: 'var(--text-lg)',
          color: 'var(--text-secondary)',
          marginBottom: '1.5rem',
          fontWeight: 600,
        }}>Page Not Found</h2>
        
        <p style={{
          fontSize: 'var(--text-base)',
          color: 'var(--text-tertiary)',
          marginBottom: '2.5rem',
          lineHeight: 1.5,
        }}>
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>

        <Link href="/" passHref legacyBehavior>
          <Button variant="primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', width: '100%', justifyContent: 'center' }}>
            <ArrowLeft size={18} />
            Back to Safety
          </Button>
        </Link>
      </div>
    </div>
  );
}

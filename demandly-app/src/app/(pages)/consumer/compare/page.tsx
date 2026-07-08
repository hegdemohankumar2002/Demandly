'use client';

import React from 'react';
import Card from '@/components/ui/Card';
import { Scale } from 'lucide-react';

export default function ComparePage() {
  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '0.5rem' }}>Compare Products</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Compare features, prices, and demand across multiple products side-by-side.</p>
      </div>

      <Card padding="lg" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <Scale size={48} style={{ margin: '0 auto 1rem', color: 'var(--secondary)' }} />
        <h2 style={{ fontSize: '18px', fontWeight: '500', marginBottom: '0.5rem' }}>Comparison tools are coming soon</h2>
        <p style={{ color: 'var(--text-secondary)' }}>We&apos;re working on making it easier for you to make informed decisions.</p>
      </Card>
    </div>
  );
}

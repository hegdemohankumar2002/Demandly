'use client';

import { Component, ErrorInfo, ReactNode } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{ padding: '2rem', textAlign: 'center', maxWidth: '400px', margin: '2rem auto' }}>
          <h2 style={{ marginBottom: '1rem', color: 'var(--danger)' }}>Something went wrong</h2>
          <p style={{ marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
            We apologize for the inconvenience. Please try again or navigate to a different page.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
            <Link href="/">
              <Button variant="outline">Go Home</Button>
            </Link>
          </div>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details style={{ marginTop: '2rem', textAlign: 'left' }}>
              <summary style={{ cursor: 'pointer', color: 'var(--text-muted)' }}>Error Details</summary>
              <pre style={{ marginTop: '0.5rem', fontSize: '0.75rem', overflow: 'auto', background: 'var(--bg-dark)', padding: '1rem', borderRadius: '0.5rem' }}>
                {this.state.error.toString()}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
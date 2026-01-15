import type { ReactNode } from 'react';
import React from 'react';

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
  error?: Error;
};

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div style={{
        height: '100%',
        display: 'grid',
        placeItems: 'center',
        padding: 24,
        color: 'var(--text-primary)',
        background: 'var(--bg-primary)',
      }}>
        <div className="card" style={{ maxWidth: 720, width: '100%' }}>
          <div className="card-header">APP ERROR</div>
          <div className="card-body" style={{ display: 'grid', gap: 12 }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
              Something went wrong. Reload the page to continue.
            </div>
            {this.state.error?.message && (
              <pre style={{
                whiteSpace: 'pre-wrap',
                color: 'var(--text-tertiary)',
                fontSize: 12,
                margin: 0,
              }}>{this.state.error.message}</pre>
            )}
            <button
              className="input"
              style={{ width: 'fit-content', padding: '8px 12px', cursor: 'pointer' }}
              onClick={() => window.location.reload()}
            >
              Reload
            </button>
          </div>
        </div>
      </div>
    );
  }
}

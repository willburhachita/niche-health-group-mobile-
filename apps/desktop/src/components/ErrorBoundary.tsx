import React from 'react';

interface Props { children: React.ReactNode }
interface State { error: Error | null }

/**
 * Catches render/lifecycle errors anywhere below it.
 *
 * Without this, a single throw in any screen unmounts the whole tree and the
 * desktop window goes blank white with nothing to go on. Styles are inline so
 * the fallback still renders even when the stylesheet failed to load.
 */
export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[NHL Connect] Unhandled UI error:', error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div style={styles.wrap}>
        <div style={styles.card}>
          <h1 style={styles.title}>NHL Connect hit an unexpected error</h1>
          <p style={styles.body}>
            The screen you opened failed to load. Your data is safe — reloading usually clears it.
          </p>
          <pre style={styles.pre}>{error.message || String(error)}</pre>
          <div style={styles.actions}>
            <button
              style={styles.primary}
              onClick={() => {
                window.location.hash = '#/dashboard';
                window.location.reload();
              }}
            >
              Reload app
            </button>
            <button style={styles.secondary} onClick={() => this.setState({ error: null })}>
              Try again
            </button>
          </div>
          <p style={styles.hint}>Press F12 to open the developer console for the full details.</p>
        </div>
      </div>
    );
  }
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    background: '#F8F9FC',
    fontFamily: "'Inter', -apple-system, 'Segoe UI', sans-serif",
  },
  card: {
    maxWidth: 560,
    width: '100%',
    background: '#fff',
    border: '1px solid #EDF0F7',
    borderRadius: 16,
    padding: 32,
    boxShadow: '0 8px 32px rgba(27,43,107,0.08)',
  },
  title: { margin: 0, fontSize: 20, fontWeight: 700, color: '#111827' },
  body: { margin: '8px 0 16px', fontSize: 14, color: '#6B7280', lineHeight: 1.5 },
  pre: {
    margin: 0,
    padding: 12,
    background: '#F8F9FC',
    border: '1px solid #EDF0F7',
    borderRadius: 8,
    fontSize: 12,
    color: '#B91C1C',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    maxHeight: 180,
    overflow: 'auto',
  },
  actions: { display: 'flex', gap: 10, marginTop: 20 },
  primary: {
    padding: '10px 18px',
    borderRadius: 10,
    border: 'none',
    background: '#1B2B6B',
    color: '#fff',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  secondary: {
    padding: '10px 18px',
    borderRadius: 10,
    border: '1px solid #E5E7EB',
    background: '#fff',
    color: '#374151',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  hint: { margin: '16px 0 0', fontSize: 12, color: '#9CA3AF' },
};

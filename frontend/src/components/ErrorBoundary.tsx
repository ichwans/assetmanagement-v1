import React from 'react';

type State = { hasError: boolean; error?: unknown };

export class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  constructor(props: React.PropsWithChildren) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: unknown) {
    return { hasError: true, error } as State;
  }

  componentDidCatch(error: unknown, info: unknown) {
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center">
            <h1 className="text-2xl font-bold mb-2">Terjadi Kesalahan</h1>
            <p className="text-muted-foreground mb-6">Coba muat ulang halaman atau kembali ke dashboard.</p>
            <div className="flex gap-3 justify-center">
              <button className="px-4 py-2 rounded-md border" onClick={() => window.location.reload()}>Muat Ulang</button>
              <a href="/" className="px-4 py-2 rounded-md bg-primary text-primary-foreground">Ke Dashboard</a>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;


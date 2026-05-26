import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-boundary-inner">
            <span className="error-boundary-icon">⚠</span>
            <h2 className="error-boundary-title">Error inesperado</h2>
            <p className="error-boundary-desc">
              Ocurrió un error al renderizar la aplicación.
              {this.state.error?.message && (
                <code className="error-boundary-code">{this.state.error.message}</code>
              )}
            </p>
            <button
              className="form-submit"
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
              style={{ marginTop: '1rem' }}
            >
              Recargar aplicación
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

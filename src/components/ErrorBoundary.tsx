import { Component, type ErrorInfo, type ReactNode } from 'react';

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

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
            <div className="mb-6 text-6xl">⚠️</div>
            <h1 className="mb-4 text-2xl font-bold text-gray-900">Oops! Something went wrong</h1>
            <p className="mb-6 text-gray-600">
              We encountered an unexpected error. Don't worry, your data is safe.
            </p>
            {this.state.error && (
              <details className="mb-6 rounded-lg bg-gray-50 p-4 text-left text-sm">
                <summary className="cursor-pointer font-semibold text-gray-700">
                  Error details
                </summary>
                <pre className="mt-2 overflow-auto text-xs text-gray-600">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
            <button
              onClick={() => window.location.reload()}
              className="w-full rounded-lg bg-strava-orange py-3 font-semibold text-white transition-colors hover:bg-strava-orange-dark"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

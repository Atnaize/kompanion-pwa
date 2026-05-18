import { Component, type ErrorInfo, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { Layout } from '@components/layout';
import { GlassCard, Button } from '@components/ui';

// Scoped boundary for an individual route. Renders its fallback INSIDE
// `Layout` so the global header / bottom nav stay interactive when a single
// page throws — much better UX than the full-screen ErrorBoundary fallback
// that forces a hard reload.
//
// Resets when the location pathname changes, so navigating away clears the
// errored subtree without the user having to click "Try again".

interface InnerProps {
  children: ReactNode;
  resetKey: string;
  t: (k: string) => string;
  onTryAgain: () => void;
  onGoHome: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class RouteErrorBoundaryInner extends Component<InnerProps, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidUpdate(prev: InnerProps): void {
    if (prev.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false, error: null });
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[RouteErrorBoundary]', error, info.componentStack);
  }

  private handleTryAgain = (): void => {
    this.setState({ hasError: false, error: null });
    this.props.onTryAgain();
  };

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;

    const { t } = this.props;
    return (
      <Layout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <GlassCard className="w-full max-w-md p-6 text-center">
            <div className="mb-4 text-5xl">⚠️</div>
            <h1 className="mb-2 text-xl font-bold text-gray-900 dark:text-gray-50">
              {t('errors.pageFailed')}
            </h1>
            <p className="mb-5 text-sm text-gray-600 dark:text-gray-400">
              {t('errors.pageFailedDesc')}
            </p>
            {this.state.error && (
              <details className="mb-5 rounded-lg bg-gray-50 p-3 text-left text-xs dark:bg-gray-950">
                <summary className="cursor-pointer font-semibold text-gray-700 dark:text-gray-300">
                  {t('errors.errorDetails')}
                </summary>
                <pre className="mt-2 overflow-auto text-gray-600 dark:text-gray-400">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
            <div className="flex gap-2">
              <Button variant="primary" onClick={this.handleTryAgain} className="flex-1">
                {t('errors.tryAgain')}
              </Button>
              <Button variant="secondary" onClick={this.props.onGoHome} className="flex-1">
                {t('errors.goHome')}
              </Button>
            </div>
          </GlassCard>
        </div>
      </Layout>
    );
  }
}

export const RouteErrorBoundary = ({ children }: { children: ReactNode }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <RouteErrorBoundaryInner
      resetKey={location.pathname}
      t={t}
      onTryAgain={() => navigate(0)}
      onGoHome={() => navigate('/dashboard')}
    >
      {children}
    </RouteErrorBoundaryInner>
  );
};

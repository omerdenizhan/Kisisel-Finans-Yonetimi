import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';

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

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Konsola yaz; production'da burada telemetry servisine gönderilebilir.
    console.error('[ErrorBoundary]', error, info);
  }

  reset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex min-h-[60vh] items-center justify-center p-6">
          <Card padding="lg" className="max-w-md text-center">
            <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-rose-500" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Bir şeyler ters gitti</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Bileşen yüklenirken beklenmeyen bir hata oluştu. Sayfayı yenilemeyi deneyin.
            </p>
            {this.state.error && (
              <pre className="mt-3 max-h-32 overflow-auto rounded-lg bg-slate-100 p-2 text-left text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {this.state.error.message}
              </pre>
            )}
            <div className="mt-4 flex justify-center gap-2">
              <Button onClick={this.reset} leftIcon={<RefreshCw className="h-4 w-4" />}>
                Yeniden Dene
              </Button>
              <Button variant="secondary" onClick={() => (window.location.href = '/')}>
                Ana Sayfa
              </Button>
            </div>
          </Card>
        </div>
      );
    }
    return this.props.children;
  }
}

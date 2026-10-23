import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Props {
  children: ReactNode;
  /** Changing this value (e.g. the pathname) clears a previous error. */
  resetKey?: unknown;
}

export class ErrorBoundary extends Component<Props, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ui] render error:', error, info.componentStack);
  }

  componentDidUpdate(prev: Props) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) this.setState({ error: null });
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="max-w-md mx-auto mt-24 text-center space-y-4" role="alert">
        <div className="mx-auto w-12 h-12 rounded-xl bg-danger-soft flex items-center justify-center">
          <AlertTriangle className="h-5 w-5 text-danger" />
        </div>
        <h1 className="font-serif text-2xl font-medium text-text-primary">Something went wrong</h1>
        <p className="text-sm text-text-secondary">This page hit an unexpected error. The rest of the console is unaffected.</p>
        <div className="flex justify-center gap-2">
          <Button variant="secondary" onClick={() => this.setState({ error: null })}>
            Try again
          </Button>
          <Button onClick={() => window.location.reload()}>Reload</Button>
        </div>
      </div>
    );
  }
}

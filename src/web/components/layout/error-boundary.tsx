import { Component } from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render(): React.ReactNode {
    if (this.state.error) {
      return (
        <div className="flex h-screen flex-col gap-6 bg-bg py-16 px-10">
          <h1 className="text-lg font-bold text-destructive-text">Something went wrong</h1>
          <pre className="overflow-auto rounded-lg bg-bg-mute p-6 font-mono text-[13px] leading-relaxed text-text-secondary">
            {this.state.error.message}
            {'\n\n'}
            {this.state.error.stack}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

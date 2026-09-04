import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 m-8 bg-red-50 text-red-900 border-2 border-red-500 rounded-2xl overflow-auto">
          <h1 className="text-2xl font-bold mb-4">Something went wrong.</h1>
          <p className="font-mono text-sm whitespace-pre-wrap">{this.state.error && this.state.error.toString()}</p>
          <pre className="mt-4 font-mono text-xs whitespace-pre-wrap opacity-80">{this.state.errorInfo && this.state.errorInfo.componentStack}</pre>
          <button 
            className="mt-6 bg-red-600 text-white px-4 py-2 rounded-lg font-bold"
            onClick={() => window.location.href = '/'}
          >
            Go back to Dashboard
          </button>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;

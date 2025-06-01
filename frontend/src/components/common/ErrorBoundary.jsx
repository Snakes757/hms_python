// src/components/common/ErrorBoundary.jsx
import React, { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error: error };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo: errorInfo });
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="container mt-5">
          <div className="alert alert-danger" role="alert">
            <h4 className="alert-heading">Oops! Something went wrong.</h4>
            <p>
              We encountered an unexpected error. Please try refreshing the page, or contact support if the problem persists.
            </p>
            <hr />
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div>
                <p className="mb-0"><strong>Error:</strong> {this.state.error.toString()}</p>
                {this.state.errorInfo && (
                  <details style={{ whiteSpace: 'pre-wrap' }} className="mt-2">
                    <summary>Error Details (Development Mode)</summary>
                    {this.state.errorInfo.componentStack}
                  </details>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;

import { Component, ErrorInfo, ReactNode } from 'react';

/**
 * Props for the ErrorBoundary component
 */
interface Props {
  /** Child components to be wrapped and protected from errors */
  children?: ReactNode;
  /** Optional custom fallback UI to display when an error occurs */
  fallback?: ReactNode;
}

/**
 * Internal state for tracking error status
 */
interface State {
  /** Flag indicating whether an error has been caught */
  hasError: boolean;
}

/**
 * ErrorBoundary component that catches JavaScript errors anywhere in the child
 * component tree and displays a fallback UI instead of crashing the entire app.
 * 
 * Usage:
 * ```tsx
 * <ErrorBoundary fallback={<CustomErrorUI />}>
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 */
class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  /**
   * Static lifecycle method called when a descendant component throws an error.
   * Updates state to trigger fallback UI rendering.
   */
  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  /**
   * Lifecycle method called after an error is caught.
   * Logs error details for debugging and monitoring purposes.
   */
  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    // Display fallback UI when an error has been caught
    if (this.state.hasError) {
      return this.props.fallback || <h1>Sorry, something went wrong.</h1>;
    }

    // Render children normally when no error has occurred
    return this.props.children;
  }
}

export default ErrorBoundary;

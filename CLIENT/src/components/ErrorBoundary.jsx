import { Component } from "react";
import { FiAlertTriangle, FiRefreshCw, FiHome } from "react-icons/fi";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an unhandled error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#030014] text-white flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-xl text-center shadow-2xl">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <FiAlertTriangle className="text-3xl" />
            </div>

            <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
            <p className="text-gray-400 text-sm mb-6">
              An unexpected error occurred in this view. Your session and progress data are safe.
            </p>

            {Boolean(import.meta.env?.DEV) && this.state.error && (
              <div className="mb-6 p-4 rounded-xl bg-black/40 border border-white/5 text-left overflow-auto max-h-40">
                <p className="text-xs font-mono text-rose-300 break-words">
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReload}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all"
              >
                <FiRefreshCw /> Reload Page
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-gray-200 font-medium text-sm border border-white/10 transition-all"
              >
                <FiHome /> Back to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    // If it's a chunk load error or syntax error from returning HTML
    const isChunkLoadError = 
      error?.name === 'ChunkLoadError' || 
      (error?.message && error.message.includes('dynamically imported module')) ||
      (error?.message && error.message.includes("Unexpected token '<"));
      
    if (isChunkLoadError) {
      // The browser cached an old index.html, or Vercel returned HTML for a missing JS chunk.
      // Reloading forces the browser to fetch the new index.html with correct chunk hashes.
      window.location.reload();
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-full flex-col items-center justify-center p-6 text-center">
          <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
          <p className="text-sm text-ink/70 mb-6">
            We encountered an unexpected error. Please try refreshing the page.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="rounded-xl bg-sky-500 px-6 py-3 font-medium text-white transition hover:bg-sky-400"
          >
            Refresh Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

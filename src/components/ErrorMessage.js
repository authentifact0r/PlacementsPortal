import React from 'react';
import { AlertCircle } from 'lucide-react';

export function ErrorMessage({ message, onRetry, className = '' }) {
  return (
    <div className={`text-center py-12 ${className}`}>
      <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
      <h3 className="text-xl font-bold text-slate-200 mb-2">Oops! Something went wrong</h3>
      <p className="text-red-400 mb-6 max-w-md mx-auto">{message}</p>
      {onRetry && (
        <button 
          onClick={onRetry} 
          className="btn-secondary inline-flex items-center gap-2"
        >
          Try Again
        </button>
      )}
    </div>
  );
}

export function ErrorCard({ message, onRetry }) {
  return (
    <div className="bg-red-900/20 backdrop-blur-sm border border-red-800/50 rounded-2xl p-8">
      <ErrorMessage message={message} onRetry={onRetry} />
    </div>
  );
}

export default ErrorMessage;

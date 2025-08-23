// use-toast.js
import React, { useState, useEffect, createContext, useContext } from 'react';

// Create a context for toasts
const ToastContext = createContext({
  toasts: [],
  toast: () => {},
  dismissToast: () => {},
});

// Provider component
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = ({ title, description, type = 'default', duration = 5000 }) => {
    const id = Math.random().toString(36).substring(2, 9);
    
    setToasts((prevToasts) => [
      ...prevToasts,
      { id, title, description, type, duration },
    ]);

    return id;
  };

  const dismissToast = (id) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  };

  const value = {
    toasts,
    toast,
    dismissToast,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

// Hook to use toast functionality
export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// Toast container component
function ToastContainer() {
  const { toasts, dismissToast } = useContext(ToastContext);

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-72">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          {...toast}
          onDismiss={() => dismissToast(toast.id)}
        />
      ))}
    </div>
  );
}

// Individual toast component
function Toast({ id, title, description, type, duration, onDismiss }) {
  useEffect(() => {
    if (duration) {
      const timer = setTimeout(() => {
        onDismiss();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onDismiss]);

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-500 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-500 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-500 text-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-500 text-blue-800';
      default:
        return 'bg-white border-gray-200 text-gray-800';
    }
  };

  return (
    <div
      className={`p-4 rounded-lg border shadow-md ${getTypeStyles()} relative animate-fade-in`}
      role="alert"
    >
      <div className="flex justify-between items-start">
        <div>
          {title && <h3 className="font-semibold">{title}</h3>}
          {description && <p className="text-sm mt-1">{description}</p>}
        </div>
        <button
          onClick={onDismiss}
          className="ml-4 inline-flex h-5 w-5 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
          aria-label="Close"
        >
          <span className="sr-only">Close</span>
          <svg
            className="h-3 w-3"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

export { useToast, ToastProvider };
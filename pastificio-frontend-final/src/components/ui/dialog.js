// dialog.js
import React, { useState, createContext, useContext } from 'react';

const DialogContext = createContext({
  open: false,
  setOpen: () => {},
});

export function Dialog({ children, onOpenChange, className = "", ...props }) {
  const [open, setOpen] = useState(false);

  const handleOpenChange = (value) => {
    setOpen(value);
    onOpenChange?.(value);
  };

  return (
    <DialogContext.Provider value={{ open, setOpen: handleOpenChange }}>
      <div className={className} {...props}>
        {children}
      </div>
    </DialogContext.Provider>
  );
}

export function DialogTrigger({ children, asChild = false, ...props }) {
  const { setOpen } = useContext(DialogContext);

  if (asChild) {
    return React.cloneElement(children, {
      ...props,
      onClick: (e) => {
        children.props.onClick?.(e);
        setOpen(true);
      },
    });
  }

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      {...props}
    >
      {children}
    </button>
  );
}

export function DialogContent({ children, className = "", ...props }) {
  const { open, setOpen } = useContext(DialogContext);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={() => setOpen(false)}
        role="presentation"
      />
      <div
        className={`relative bg-white rounded-lg shadow-lg max-w-md w-full p-6 max-h-[85vh] overflow-y-auto ${className}`}
        {...props}
      >
        {children}
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-500"
          aria-label="Close"
        >
          <svg
            className="h-5 w-5"
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

export function DialogHeader({ children, className = "", ...props }) {
  return (
    <div
      className={`mb-4 text-center sm:text-left ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function DialogTitle({ children, className = "", ...props }) {
  return (
    <h3
      className={`text-lg font-semibold leading-6 ${className}`}
      {...props}
    >
      {children}
    </h3>
  );
}

export function DialogDescription({ children, className = "", ...props }) {
  return (
    <div
      className={`mt-2 text-sm text-gray-500 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function DialogFooter({ children, className = "", ...props }) {
  return (
    <div
      className={`mt-6 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter };
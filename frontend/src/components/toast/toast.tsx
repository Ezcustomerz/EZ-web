// toast.tsx
import { createContext, useContext, useState, type ReactNode } from 'react';
import { Snackbar, Alert, type AlertColor } from '@mui/material';

interface ToastProps {
  title: string;
  description?: string;
  variant?: AlertColor;
  duration?: number;
}

interface ToastState extends ToastProps {
  id: string;
  open: boolean;
}

interface ToastContextType {
  toast: (props: ToastProps) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
};


let internalToastFn: ((props: ToastProps) => void) | null = null;
const setToastRef = (fn: (props: ToastProps) => void) => {
  internalToastFn = fn;
};


export const toast = (props: ToastProps) => {
  if (internalToastFn) internalToastFn(props);
  else console.warn('Toast system is not yet initialized');
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastState[]>([]);

  const showToast = ({
    title,
    description,
    variant = 'info',
    duration = 6000,
  }: ToastProps) => {
    const id = crypto.randomUUID();
    const newToast: ToastState = { id, title, description, variant, duration, open: true };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, open: false } : t)));
    }, duration);
  };


  setToastRef(showToast);

  const dismiss = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleClose = (id: string) => {
    dismiss(id);
  };

  return (
    <ToastContext.Provider value={{ toast: showToast }}>
      {children}
      {toasts.map(({ id, title, description, variant, open }) => (
        <Snackbar
          key={id}
          open={open}
          onClose={() => handleClose(id)}
          autoHideDuration={6000}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={() => handleClose(id)}
            severity={variant}
            variant="filled"
            sx={{
              width: '100%',
              borderRadius: 4,
              ...(variant === 'success' && {
                color: 'white',
              }),
            }}
          >
            <strong>{title}</strong>
            {description && <div>{description}</div>}
          </Alert>

        </Snackbar>
      ))}
    </ToastContext.Provider>
  );
};

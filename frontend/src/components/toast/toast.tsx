// toast.tsx
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { Snackbar, Alert, type AlertColor, Box } from '@mui/material';

interface ToastProps {
  title: string;
  description?: string;
  variant?: AlertColor;
  duration?: number;
}

interface ToastState extends ToastProps {
  id: string;
  open: boolean;
  startTime: number;
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

// Utility function for error toasts
export const errorToast = (title: string, description?: string) => {
  toast({
    title,
    description,
    variant: 'error',
    duration: 8000, // Longer duration for errors
  });
};

// Utility function for success toasts
export const successToast = (title: string, description?: string) => {
  toast({
    title,
    description,
    variant: 'success',
    duration: 4000,
  });
};

// Progress bar component for individual toast
const ToastProgressBar = ({ toast }: { toast: ToastState }) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const duration = toast.duration || 6000; // Default duration if undefined
    const interval = setInterval(() => {
      const elapsed = Date.now() - toast.startTime;
      const remaining = Math.max(0, duration - elapsed);
      const progressPercent = (remaining / duration) * 100;
      setProgress(progressPercent);

      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 50); // Update every 50ms for smooth animation

    return () => clearInterval(interval);
  }, [toast.startTime, toast.duration]);

  // Get progress bar color based on toast variant
  const getProgressBarColor = () => {
    switch (toast.variant) {
      case 'success':
        return 'rgba(0, 0, 0, 0.4)'; // Dark color for green background
      case 'error':
        return 'rgba(255, 255, 255, 0.4)'; // Light color for red background
      case 'warning':
        return 'rgba(0, 0, 0, 0.4)'; // Dark color for yellow/orange background
      case 'info':
      default:
        return 'rgba(255, 255, 255, 0.4)'; // Light color for blue background
    }
  };

  return (
    <Box
      sx={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        height: 3,
        backgroundColor: getProgressBarColor(),
        width: `${progress}%`,
        transition: 'width 50ms linear',
        borderRadius: '0 0 4px 4px',
      }}
    />
  );
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastState[]>([]);

  const showToast = ({
    title,
    description,
    variant = 'info',
    duration = 6000,
  }: ToastProps) => {
    // For error toasts, extend duration and ensure they're visible
    const errorDuration = variant === 'error' ? 8000 : duration;
    
    const id = crypto.randomUUID();
    const newToast: ToastState = { 
      id, 
      title, 
      description, 
      variant, 
      duration: errorDuration, 
      open: true,
      startTime: Date.now()
    };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, open: false } : t)));
    }, errorDuration);
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
      {toasts.map((toast) => (
        <Snackbar
          key={toast.id}
          open={toast.open}
          onClose={() => handleClose(toast.id)}
          autoHideDuration={6000}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          sx={{
            bottom: { xs: 80, sm: 24 },
            left: { xs: 16, sm: 'auto' },
            right: { xs: 16, sm: 'auto' },
            width: { xs: 'calc(100% - 32px)', sm: 'auto' },
            maxWidth: { xs: '100%', sm: 600 },
          }}
        >
          <Alert
            onClose={() => handleClose(toast.id)}
            severity={toast.variant}
            variant="filled"
            sx={{
              width: '100%',
              borderRadius: 1,
              position: 'relative',
              overflow: 'hidden',
              ...(toast.variant === 'success' && {
                color: 'white',
              }),
              ...(toast.variant === 'error' && {
                color: 'white',
                fontWeight: 'bold',
                '& .MuiAlert-icon': {
                  fontSize: '1.5rem',
                },
              }),
            }}
          >
            <strong>{toast.title}</strong>
            {toast.description && <div>{toast.description}</div>}
            <ToastProgressBar toast={toast} />
          </Alert>

        </Snackbar>
      ))}
    </ToastContext.Provider>
  );
};

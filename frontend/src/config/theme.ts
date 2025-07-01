import { createTheme } from '@mui/material/styles';
import type { ThemeOptions } from '@mui/material/styles';
import type { ColorConfig } from './color';

/**
 * Creates a Material UI theme from our color configuration
 * This ensures that Material UI components use the same colors as our CSS variables
 */
export function createAppTheme(colors: ColorConfig): ThemeOptions {
    const primaryHex = colors.primary;
    const secondaryHex = colors.secondary;
    const textHex = colors.text;
    const textSecondaryHex = colors.textSecondary;
    const backgroundHex = colors.background;
    const errorHex = colors.error;
    const warningHex = colors.warning;
    const infoHex = colors.info;
    const successHex = colors.success;

    return createTheme({
        palette: {
            mode: 'light',
            primary: {
                main: primaryHex,
                contrastText: '#FFFFFF',
            },
            secondary: {
                main: secondaryHex,
                contrastText: textHex,
            },
            background: {
                default: backgroundHex,
                paper: 'rgba(255, 255, 255, 0.75)',
            },
            text: {
                primary: textHex,
                secondary: textSecondaryHex,
            },
            success: {
                main: successHex,
            },
            error: {
                main: errorHex,
            },
            warning: {
                main: warningHex,
            },
            info: {
                main: infoHex,
            },
        },
        typography: {
            fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
            h1: {
                fontSize: '28px',
                fontWeight: 500,
            },
            h2: {
                fontSize: '24px',
                fontWeight: 600,
            },
            h3: {
                fontSize: '20px',
                fontWeight: 450,
            },
            subtitle1: {
                fontSize: '15px',
                fontWeight: 500,
            },
            subtitle2: {
                fontSize: '15px',
                fontWeight: 600,
            },
            body1: {
                fontSize: '16px',
            },
            body2: {
                fontSize: '14px',
            },
        },
        shape: {
            borderRadius: 8,
        },
        components: {
            MuiListItemText: {
                styleOverrides: {
                    primary: {
                        fontWeight: 500,
                        fontSize: '0.95rem',
                    },
                },
            },
            MuiPaper: {
                styleOverrides: {
                    root: {
                        backdropFilter: 'blur(10px)',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)',
                        borderRadius: 4,
                    },
                },
            },
            MuiButton: {
                styleOverrides: {
                    root: {
                        borderRadius: 4,
                        textTransform: 'none',
                        fontWeight: 500,
                        fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
                        '&:focus': {
                            outline: 'none',
                            boxShadow: 'none',
                        },
                    },
                },
            },
            MuiIconButton: {
                styleOverrides: {
                    root: {
                        '&:focus': {
                            outline: 'none',
                            boxShadow: 'none',
                        },
                    },
                },
            },

            MuiCard: {
                styleOverrides: {
                    root: {
                        borderRadius: 16,
                        backdropFilter: 'blur(6px)',
                        border: '1px solid #e5e7eb',
                    },
                },
            },
        },
    });
} 
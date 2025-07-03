import { createTheme } from '@mui/material/styles';
import type { ThemeOptions } from '@mui/material/styles';
import type { ColorConfig } from './color';
import '@mui/material/styles';


declare module '@mui/material/styles' {
    interface Palette {
        custom: {
            amber: string;
        };
    }
    interface PaletteOptions {
        custom?: {
            amber: string;
        };
    }
}


/**
 * Creates a Material UI theme from our color configuration
 * This ensures that Material UI components use the same colors as our CSS variables
 */
export function createAppTheme(colors: ColorConfig): ThemeOptions {
    const primaryHex = colors.primary;
    const secondaryHex = colors.secondary;
    const accentHex = colors.accent;
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
            custom: {
                amber: accentHex,
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
                fontSize: 'clamp(24px, 4vw, 28px)',
                fontWeight: 500,
            },
            h2: {
                fontSize: 'clamp(20px, 3.5vw, 24px)',
                fontWeight: 600,
            },
            h3: {
                fontSize: 'clamp(18px, 3vw, 20px)',
                fontWeight: 450,
            },
            h4: {
                fontSize: 'clamp(16px, 2.5vw, 18px)',
                fontWeight: 500,
            },
            h5: {
                fontSize: 'clamp(14px, 2.2vw, 16px)',
                fontWeight: 500,
            },
            h6: {
                fontSize: 'clamp(13px, 2vw, 15px)',
                fontWeight: 600,
            },
            subtitle1: {
                fontSize: 'clamp(14px, 2vw, 15px)',
                fontWeight: 500,
            },
            subtitle2: {
                fontSize: 'clamp(14px, 2vw, 15px)',
                fontWeight: 600,
            },
            body1: {
                fontSize: 'clamp(14px, 2.2vw, 16px)',
            },
            body2: {
                fontSize: 'clamp(12px, 2vw, 14px)',
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
                        borderRadius: 'clamp(12px, 2vw, 16px)',
                        backdropFilter: 'blur(6px)',
                        border: '1px solid #e5e7eb',
                        transition: 'all 0.3s ease',
                    },
                },
            },
        },
    });
} 
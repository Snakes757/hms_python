// src/styles/theme.js
// Theme object for consistent styling across custom components or for overriding.
// Bootstrap is primary, but this can be used for JS-accessible theme values.

export const theme = {
  colors: {
    primary: '#0d6efd',        // Bootstrap Primary
    primaryDark: '#0a58ca',    // Darker shade for hover/active
    primaryLight: '#cfe2ff',   // Lighter shade for backgrounds/alerts
    secondary: '#6c757d',      // Bootstrap Secondary
    secondaryDark: '#5a6268',
    secondaryLight: '#e2e6ea',
    success: '#198754',        // Bootstrap Success
    successLight: '#d1e7dd',
    danger: '#dc3545',         // Bootstrap Danger
    dangerLight: '#f8d7da',
    warning: '#ffc107',        // Bootstrap Warning (text often needs to be dark)
    warningLight: '#fff3cd',
    info: '#0dcaf0',           // Bootstrap Info (text often needs to be dark)
    infoLight: '#cff4fc',
    light: '#f8f9fa',          // Bootstrap Light
    dark: '#212529',           // Bootstrap Dark
    white: '#ffffff',
    black: '#000000',
    
    textPrimary: '#212529',     // Default text color
    textSecondary: '#6c757d',   // Muted/secondary text
    textDisabled: '#adb5bd',    // Disabled text
    textLight: '#f8f9fa',       // Text on dark backgrounds
    
    backgroundPage: '#eef2f6', // A slightly off-white, soft background for the entire page
    backgroundComponent: '#ffffff', // Default background for cards, modals, etc.
    backgroundMuted: '#f8f9fa',  // Bootstrap .bg-light equivalent

    borderDefault: '#dee2e6',    // Bootstrap default border
    borderInput: '#ced4da',      // Bootstrap input border
    borderFocus: '#86b7fe',      // Bootstrap input focus border color (glow is separate)
  },
  fonts: {
    body: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'Liberation Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'",
    heading: "inherit", 
    monospace: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
  fontSizes: { // Based on Bootstrap's scale (approximate)
    xs: '0.75rem',   // 12px
    sm: '0.875rem',  // 14px
    base: '1rem',    // 16px (default)
    lg: '1.25rem',   // 20px
    xl: '1.5rem',    // 24px
    xxl: '2rem',     // 32px
    display1: '5rem',
    display2: '4.5rem',
    // ... and so on for h1, h2 etc. if needed directly in JS
  },
  fontWeights: { // Bootstrap standard weights
    light: 300,
    normal: 400,
    semibold: 600, // Added for emphasis
    bold: 700,
  },
  lineHeights: {
    base: 1.5,
    heading: 1.2,
    tight: 1.1,
  },
  spacing: { // Align with Bootstrap's $spacer multiples if possible
    '0': '0',
    '1': '0.25rem', // $spacer * .25
    '2': '0.5rem',  // $spacer * .5
    '3': '1rem',    // $spacer
    '4': '1.5rem',  // $spacer * 1.5
    '5': '3rem',    // $spacer * 3
  },
  breakpoints: { // For JS logic if needed, CSS uses media queries
    xs: '0px',
    sm: '576px',
    md: '768px',
    lg: '992px',
    xl: '1200px',
    xxl: '1400px',
  },
  radii: { // Bootstrap border radiuses
    sm: '0.2rem',    // .rounded-1
    default: '0.25rem',// .rounded or .rounded-2 (Bootstrap 5 uses 0.375rem for .rounded)
                      // Let's use Bootstrap 5's default:
    bsDefault: '0.375rem', // Bootstrap 5 .rounded
    lg: '0.5rem',    // .rounded-3 (Bootstrap 5 uses 0.5rem for .rounded-3)
    pill: '50rem',   // .rounded-pill
    circle: '50%',
  },
  shadows: {
    sm: '0 .125rem .25rem rgba(0,0,0,.075)',
    default: '0 .5rem 1rem rgba(0,0,0,.15)',
    lg: '0 1rem 3rem rgba(0,0,0,.175)',
    none: 'none',
  },
  zIndex: { // Common z-index values from Bootstrap
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    offcanvasBackdrop: 1040,
    offcanvas: 1045,
    modalBackdrop: 1050,
    modal: 1055,
    popover: 1070,
    tooltip: 1080,
  },
};

export default theme;

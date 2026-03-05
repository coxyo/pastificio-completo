// src/theme/theme.js
// Palette derivata dal logo ufficiale Pastificio Nonna Claudia
// Verde: #2E7B00, Oro/Grano: #C8A830, Rosso: #CC2200

import { createTheme, alpha } from '@mui/material/styles';

// ─── TOKEN COLORI BRAND ───────────────────────────────────────────────────────
export const BRAND = {
  // Dal logo: verde corsivo "Pastificio Nonna Claudia"
  green:        '#2E7B00',
  greenDark:    '#1B5200',
  greenLight:   '#4CAF50',
  greenPale:    '#E8F5E3',

  // Dal logo: spighe di grano dorate
  gold:         '#C8A830',
  goldDark:     '#A08020',
  goldLight:    '#E5D280',
  goldPale:     '#FDF8E8',

  // Dal logo: fiocco rosso + bordo ovale rosso
  red:          '#CC2200',
  redDark:      '#991A00',
  redLight:     '#FF5533',
  redPale:      '#FFF0ED',

  // Neutri caldi (sfondo crema pasta)
  cream:        '#FDF8F0',
  creamDark:    '#F5EDD8',
  brownDark:    '#3E2723',
  brownMid:     '#6D4C41',
  brownLight:   '#A1887F',

  // Categorie prodotti (invariate per compatibilità)
  catRavioli:   '#E3F2FD',
  catDolci:     '#FFF3E0',
  catPardulas:  '#F3E5F5',
  catPanadas:   '#E8F5E9',
  catPasta:     '#FFFDE7',
};

// ─── THEME MUI ────────────────────────────────────────────────────────────────
const theme = createTheme({
  // ── Palette ──────────────────────────────────────────────────────────────
  palette: {
    mode: 'light',

    primary: {
      main:         BRAND.green,
      dark:         BRAND.greenDark,
      light:        BRAND.greenLight,
      contrastText: '#FFFFFF',
    },

    secondary: {
      main:         BRAND.gold,
      dark:         BRAND.goldDark,
      light:        BRAND.goldLight,
      contrastText: BRAND.brownDark,
    },

    error: {
      main:         BRAND.red,
      dark:         BRAND.redDark,
      light:        BRAND.redLight,
    },

    warning: {
      main:   '#F57C00',
      light:  '#FFB74D',
      dark:   '#E65100',
    },

    success: {
      main:   BRAND.green,
      dark:   BRAND.greenDark,
      light:  BRAND.greenLight,
    },

    info: {
      main:   '#0277BD',
      light:  '#4FC3F7',
      dark:   '#01579B',
    },

    background: {
      default: BRAND.cream,
      paper:   '#FFFFFF',
    },

    text: {
      primary:   BRAND.brownDark,
      secondary: BRAND.brownMid,
      disabled:  BRAND.brownLight,
    },

    divider: alpha(BRAND.brownDark, 0.12),

    // Token custom accessibili via theme.palette.brand
    brand: BRAND,
  },

  // ── Typography ───────────────────────────────────────────────────────────
  typography: {
    fontFamily: '"Open Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontWeightLight:   300,
    fontWeightRegular: 400,
    fontWeightMedium:  600,
    fontWeightBold:    700,

    h1: { fontSize: '2rem',    fontWeight: 700, lineHeight: 1.2, color: BRAND.brownDark },
    h2: { fontSize: '1.5rem',  fontWeight: 700, lineHeight: 1.25 },
    h3: { fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.3 },
    h4: { fontSize: '1.1rem',  fontWeight: 600, lineHeight: 1.35 },
    h5: { fontSize: '1rem',    fontWeight: 600, lineHeight: 1.4 },
    h6: { fontSize: '0.95rem', fontWeight: 600, lineHeight: 1.4 },

    body1: { fontSize: '1rem',    lineHeight: 1.6 },
    body2: { fontSize: '0.875rem',lineHeight: 1.57 },

    caption:  { fontSize: '0.75rem',  lineHeight: 1.5, color: BRAND.brownMid },
    overline: { fontSize: '0.7rem',   lineHeight: 2.5, letterSpacing: '0.08em', textTransform: 'uppercase' },

    button: {
      fontSize:      '0.9rem',
      fontWeight:    600,
      textTransform: 'none',   // No ALL-CAPS
      letterSpacing: '0.02em',
    },
  },

  // ── Breakpoints ──────────────────────────────────────────────────────────
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
      // Alias semantici aggiuntivi
      tablet:  768,
      desktop: 1024,
    },
  },

  // ── Shape ────────────────────────────────────────────────────────────────
  shape: {
    borderRadius: 10,
  },

  // ── Spacing ──────────────────────────────────────────────────────────────
  spacing: 8, // base 8px

  // ── Shadows personalizzate ───────────────────────────────────────────────
  shadows: [
    'none',
    '0px 1px 3px rgba(62,39,35,0.08)',
    '0px 2px 6px rgba(62,39,35,0.10)',
    '0px 4px 12px rgba(62,39,35,0.12)',
    '0px 6px 16px rgba(62,39,35,0.14)',
    '0px 8px 24px rgba(62,39,35,0.16)',
    ...Array(19).fill('none'), // placeholder per indici 6-24
  ],

  // ── Overrides componenti ─────────────────────────────────────────────────
  components: {

    // ── AppBar ──────────────────────────────────────────────────────────
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: `linear-gradient(135deg, ${BRAND.greenDark} 0%, ${BRAND.green} 60%, ${BRAND.greenLight} 100%)`,
          boxShadow: '0 2px 8px rgba(0,0,0,0.20)',
          backdropFilter: 'blur(8px)',
        },
      },
    },

    // ── Toolbar ─────────────────────────────────────────────────────────
    MuiToolbar: {
      styleOverrides: {
        root: {
          minHeight: 56,
          '@media (min-width:600px)': { minHeight: 64 },
        },
      },
    },

    // ── Drawer / sidebar ────────────────────────────────────────────────
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: BRAND.brownDark,
          color: '#FFFFFF',
          borderRight: 'none',
          boxShadow: '4px 0 16px rgba(0,0,0,0.25)',
        },
      },
    },

    // ── ListItemButton (menu sidebar) ───────────────────────────────────
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '2px 8px',
          padding: '10px 12px',
          transition: 'all 0.15s ease',
          color: 'rgba(255,255,255,0.82)',

          '&:hover': {
            backgroundColor: alpha(BRAND.gold, 0.18),
            color: '#FFFFFF',
          },

          '&.Mui-selected': {
            backgroundColor: alpha(BRAND.gold, 0.28),
            color: BRAND.goldLight,
            borderLeft: `3px solid ${BRAND.gold}`,
            paddingLeft: 9, // compensa border

            '&:hover': {
              backgroundColor: alpha(BRAND.gold, 0.36),
            },

            '& .MuiListItemIcon-root': {
              color: BRAND.goldLight,
            },
          },
        },
      },
    },

    // ── ListItemIcon (sidebar) ──────────────────────────────────────────
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          color: 'rgba(255,255,255,0.65)',
          minWidth: 38,
        },
      },
    },

    // ── ListItemText (sidebar) ──────────────────────────────────────────
    MuiListItemText: {
      styleOverrides: {
        primary: {
          fontSize: '0.875rem',
          fontWeight: 500,
        },
      },
    },

    // ── Button ──────────────────────────────────────────────────────────
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '9px 20px',
          minHeight: 44,          // touch target iOS HIG
          boxShadow: 'none',
          '&:hover': { boxShadow: '0 2px 8px rgba(0,0,0,0.15)' },
        },
        containedPrimary: {
          backgroundImage: `linear-gradient(135deg, ${BRAND.greenDark}, ${BRAND.green})`,
          '&:hover': {
            backgroundImage: `linear-gradient(135deg, ${BRAND.green}, ${BRAND.greenLight})`,
          },
        },
        containedSecondary: {
          backgroundImage: `linear-gradient(135deg, ${BRAND.goldDark}, ${BRAND.gold})`,
          color: BRAND.brownDark,
        },
        outlined: {
          borderWidth: '1.5px',
          '&:hover': { borderWidth: '1.5px' },
        },
        sizeLarge: {
          minHeight: 52,
          fontSize: '1rem',
          padding: '12px 28px',
        },
        sizeSmall: {
          minHeight: 36,
          fontSize: '0.8rem',
          padding: '6px 14px',
        },
      },
    },

    // ── IconButton ──────────────────────────────────────────────────────
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          minWidth:  44,
          minHeight: 44,
          transition: 'background-color 0.15s ease',
        },
      },
    },

    // ── Chip ────────────────────────────────────────────────────────────
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 600,
          fontSize: '0.8rem',
        },
        sizeSmall: {
          height: 24,
          fontSize: '0.72rem',
        },
      },
    },

    // ── Card ────────────────────────────────────────────────────────────
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(62,39,35,0.10)',
          border: `1px solid ${alpha(BRAND.brownDark, 0.08)}`,
          transition: 'box-shadow 0.2s ease, transform 0.15s ease',
          '&:hover': {
            boxShadow: '0 6px 20px rgba(62,39,35,0.15)',
          },
        },
      },
    },

    // ── Paper ───────────────────────────────────────────────────────────
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        rounded: {
          borderRadius: 12,
        },
        elevation1: {
          boxShadow: '0 2px 8px rgba(62,39,35,0.10)',
        },
        elevation2: {
          boxShadow: '0 4px 12px rgba(62,39,35,0.12)',
        },
        elevation3: {
          boxShadow: '0 6px 20px rgba(62,39,35,0.15)',
        },
      },
    },

    // ── TextField ───────────────────────────────────────────────────────
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        size: 'small',
      },
    },

    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundColor: '#FFFFFF',
          minHeight: 44,          // touch-friendly
          fontSize: '1rem',       // no auto-zoom iOS
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: BRAND.green,
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: BRAND.green,
            borderWidth: 2,
          },
        },
        input: {
          padding: '10px 14px',
          fontSize: '1rem',       // ≥ 16px: no auto-zoom iOS
        },
      },
    },

    // ── InputLabel ──────────────────────────────────────────────────────
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem',
          '&.Mui-focused': { color: BRAND.green },
        },
      },
    },

    // ── Select ──────────────────────────────────────────────────────────
    MuiSelect: {
      styleOverrides: {
        select: {
          minHeight: 44,
          display: 'flex',
          alignItems: 'center',
        },
      },
    },

    // ── Tab ─────────────────────────────────────────────────────────────
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          minHeight: 48,
          fontSize: '0.875rem',
          '&.Mui-selected': { color: BRAND.green },
        },
      },
    },

    MuiTabs: {
      styleOverrides: {
        indicator: {
          backgroundColor: BRAND.green,
          height: 3,
          borderRadius: '3px 3px 0 0',
        },
      },
    },

    // ── Dialog ──────────────────────────────────────────────────────────
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          boxShadow: '0 24px 48px rgba(0,0,0,0.20)',
        },
      },
    },

    MuiDialogTitle: {
      styleOverrides: {
        root: {
          backgroundColor: BRAND.green,
          color: '#FFFFFF',
          fontWeight: 700,
          fontSize: '1.1rem',
          padding: '16px 24px',
        },
      },
    },

    // ── Divider ─────────────────────────────────────────────────────────
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: alpha(BRAND.brownDark, 0.10),
        },
      },
    },

    // ── Badge ───────────────────────────────────────────────────────────
    MuiBadge: {
      styleOverrides: {
        badge: {
          fontWeight: 700,
          fontSize: '0.7rem',
        },
      },
    },

    // ── Tooltip ─────────────────────────────────────────────────────────
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: BRAND.brownDark,
          fontSize: '0.8rem',
          borderRadius: 6,
          padding: '6px 10px',
        },
        arrow: {
          color: BRAND.brownDark,
        },
      },
    },

    // ── Snackbar / Alert ────────────────────────────────────────────────
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          fontWeight: 500,
        },
        standardSuccess: {
          backgroundColor: BRAND.greenPale,
          color: BRAND.greenDark,
          borderLeft: `4px solid ${BRAND.green}`,
        },
        standardWarning: {
          borderLeft: '4px solid #F57C00',
        },
        standardError: {
          backgroundColor: BRAND.redPale,
          borderLeft: `4px solid ${BRAND.red}`,
        },
      },
    },

    // ── Switch ──────────────────────────────────────────────────────────
    MuiSwitch: {
      styleOverrides: {
        switchBase: {
          '&.Mui-checked': {
            color: BRAND.green,
            '& + .MuiSwitch-track': { backgroundColor: BRAND.green },
          },
        },
      },
    },

    // ── Checkbox ────────────────────────────────────────────────────────
    MuiCheckbox: {
      styleOverrides: {
        root: {
          '&.Mui-checked': { color: BRAND.green },
        },
      },
    },

    // ── Radio ───────────────────────────────────────────────────────────
    MuiRadio: {
      styleOverrides: {
        root: {
          '&.Mui-checked': { color: BRAND.green },
        },
      },
    },

    // ── LinearProgress ──────────────────────────────────────────────────
    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 4, height: 6 },
        barColorPrimary: {
          backgroundImage: `linear-gradient(90deg, ${BRAND.green}, ${BRAND.gold})`,
        },
      },
    },

    // ── Table ───────────────────────────────────────────────────────────
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-root': {
            backgroundColor: BRAND.greenPale,
            color: BRAND.greenDark,
            fontWeight: 700,
            fontSize: '0.8rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            borderBottom: `2px solid ${BRAND.green}`,
          },
        },
      },
    },

    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:nth-of-type(even)': {
            backgroundColor: alpha(BRAND.cream, 0.6),
          },
          '&:hover': {
            backgroundColor: alpha(BRAND.goldPale, 0.8),
          },
        },
      },
    },

    // ── FAB ─────────────────────────────────────────────────────────────
    MuiFab: {
      styleOverrides: {
        root: {
          backgroundImage: `linear-gradient(135deg, ${BRAND.greenDark}, ${BRAND.green})`,
          color: '#FFFFFF',
          boxShadow: '0 6px 20px rgba(46,123,0,0.35)',
          '&:hover': {
            backgroundImage: `linear-gradient(135deg, ${BRAND.green}, ${BRAND.greenLight})`,
            boxShadow: '0 8px 28px rgba(46,123,0,0.45)',
          },
        },
      },
    },
  },
});

export default theme;
// src/theme/muiTheme.js
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', // usa il tuo --primary-color
    },
    secondary: {
      main: '#dc004e', // usa il tuo --secondary-color
    },
    error: {
      main: '#d32f2f', // usa il tuo --error-color
    },
    warning: {
      main: '#ed6c02', // usa il tuo --warning-color
    },
    info: {
      main: '#0288d1', // usa il tuo --info-color
    },
    success: {
      main: '#2e7d32', // usa il tuo --success-color
    },
  },
  typography: {
    fontFamily: "'Inter', sans-serif",
    button: {
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          fontFamily: "'Inter', sans-serif",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 8,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        size: 'small',
      },
    },
  },
});

export default theme;
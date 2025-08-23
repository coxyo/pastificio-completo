// components/common/ErrorDisplay.js
import React from 'react';
import { Alert, AlertTitle, Box, Button } from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';

const ErrorDisplay = ({ message, onRetry }) => {
  return (
    <Box sx={{ my: 2 }}>
      <Alert 
        severity="error"
        action={
          onRetry ? (
            <Button
              color="inherit"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={onRetry}
            >
              Riprova
            </Button>
          ) : undefined
        }
      >
        <AlertTitle>Errore</AlertTitle>
        {message || 'Si è verificato un errore. Riprova più tardi.'}
      </Alert>
    </Box>
  );
};

export default ErrorDisplay;
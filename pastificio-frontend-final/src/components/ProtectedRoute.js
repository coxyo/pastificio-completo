import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Loader2 } from 'lucide-react';

/**
 * Componente per proteggere le rotte che richiedono autenticazione
 * Se l'utente non è autenticato, viene reindirizzato alla pagina di login
 * Se è in corso la verifica dell'autenticazione, viene mostrato un loader
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, checkingAuth } = useAuth();

  if (checkingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="ml-2 text-lg">Verifica autenticazione...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
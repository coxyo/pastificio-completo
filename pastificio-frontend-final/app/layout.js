// app/layout.js - ✅ AGGIORNATO: Con AuthProvider
import './globals.css';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/contexts/AuthContext';
import { OrdiniProvider } from '@/contexts/OrdiniContext';
import AuthGate from '@/components/AuthGate';
import GlobalPopups from '@/components/GlobalPopups';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Pastificio Nonna Claudia',
  description: 'Sistema di gestione ordini con integrazione 3CX',
};

export default function RootLayout({ children }) {
  return (
    <html lang="it">
      <body className={inter.className}>
        <AuthProvider>
          {/* ✅ AuthGate: mostra Login se non autenticato, altrimenti il layout normale */}
          <AuthGate>
            {/* ✅ POPUP HACCP GLOBALI */}
            <GlobalPopups />
            
            <OrdiniProvider>
              {children}
            </OrdiniProvider>
          </AuthGate>
        </AuthProvider>
      </body>
    </html>
  );
}
// app/layout.js - ROOT LAYOUT SEMPLIFICATO
import './globals.css';
import { Inter } from 'next/font/google';
import { OrdiniProvider } from '@/contexts/OrdiniContext';
import ClientLayout from './ClientLayout';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Pastificio Nonna Claudia',
  description: 'Sistema di gestione ordini con integrazione 3CX',
};

export default function RootLayout({ children }) {
  return (
    <html lang="it">
      <body className={inter.className}>
        <OrdiniProvider>
          <ClientLayout>
            {children}
          </ClientLayout>
        </OrdiniProvider>
      </body>
    </html>
  );
}

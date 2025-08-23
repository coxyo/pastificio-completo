// app/layout.js
import './globals.css';
import { Inter } from 'next/font/google';
import { OrdiniProvider } from '@/contexts/OrdiniContext';
import ClientLayout from '@/components/ClientLayout';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Pastificio Nonna Claudia',
  description: 'Sistema di gestione ordini',
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
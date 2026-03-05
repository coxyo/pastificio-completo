// app/layout.js - ✅ AGGIORNATO: ThemeProvider brand + meta PWA + Open Sans
import './globals.css';
import { Open_Sans } from 'next/font/google';
import { AuthProvider } from '@/contexts/AuthContext';
import { OrdiniProvider } from '@/contexts/OrdiniContext';
import AuthGate from '@/components/AuthGate';
import GlobalPopups from '@/components/GlobalPopups';
import ThemeRegistry from '@/components/ThemeRegistry';

const openSans = Open_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '600', '700'],
  display: 'swap',
  variable: '--font-open-sans',
});

export const metadata = {
  title: 'Pastificio Nonna Claudia',
  description: 'Sistema gestionale - Pastificio Nonna Claudia, Assemini (CA)',
  manifest: '/manifest.json',
  themeColor: '#2E7B00',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Nonna Claudia',
  },
  icons: {
    icon: '/icons/icon-192x192.png',
    apple: '/icons/apple-touch-icon.png',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    viewportFit: 'cover',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="it" className={openSans.variable}>
      <head>
        {/* PWA iOS */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Nonna Claudia" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        {/* Preconnect font */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      </head>
      <body style={{ margin: 0, backgroundColor: '#FDF8F0' }}>
        <ThemeRegistry>
          <AuthProvider>
            <AuthGate>
              <GlobalPopups />
              <OrdiniProvider>
                {children}
              </OrdiniProvider>
            </AuthGate>
          </AuthProvider>
        </ThemeRegistry>
      </body>
    </html>
  );
}
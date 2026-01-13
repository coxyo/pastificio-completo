// app/zeppole/page.js
// ✅ Pagina dedicata alla gestione Zeppole (App Router Next.js 13+)

'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import GestioneZeppole from '@/components/GestioneZeppole';

export default function ZeppolePage() {
  const router = useRouter();

  useEffect(() => {
    // Verifica autenticazione
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  return <GestioneZeppole />;
}
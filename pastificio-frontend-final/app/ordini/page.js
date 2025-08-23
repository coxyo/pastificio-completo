// app/ordini/page.js (NON GestoreOrdini.js)
'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import GestoreOrdini from '@/components/GestoreOrdini';

export default function OrdiniPage() {
  const pathname = usePathname();
  
  // Se il path contiene /report, mostra la pagina di report
  if (pathname && pathname.includes('/report')) {
    // Redirect alla pagina report
    if (typeof window !== 'undefined') {
      window.location.href = '/report';
    }
    return null;
  }
  
  // Altrimenti mostra GestoreOrdini
  return <GestoreOrdini />;
}
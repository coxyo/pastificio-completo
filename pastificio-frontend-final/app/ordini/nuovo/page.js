// app/ordini/nuovo/page.js
'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function NuovoOrdinePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to ordini page with a flag to open the dialog
    router.push('/ordini?nuovo=true');
  }, [router]);

  return null;
}
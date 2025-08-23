// app/test/page.js
'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@mui/material';

export default function TestPage() {
  const router = useRouter();
  
  return (
    <div>
      <h1>Test Navigation</h1>
      <Button onClick={() => router.push('/dashboard')}>
        Vai alla Dashboard
      </Button>
      <Button onClick={() => router.push('/login')}>
        Vai al Login
      </Button>
    </div>
  );
}
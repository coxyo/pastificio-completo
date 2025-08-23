'use client';

import React from 'react';
import Report from '@/components/Report';
import { useOrdini } from '@/contexts/OrdiniContext';

export default function ReportVenditePage() {
  const { ordini, isConnected } = useOrdini();
  
  return <Report ordini={ordini} isConnected={isConnected} />;
}
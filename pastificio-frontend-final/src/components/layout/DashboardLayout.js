// pastificio-frontend/src/components/layout/DashboardLayout.js
'use client';

import { webSocketService } from '../../services/webSocketService';

export default function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
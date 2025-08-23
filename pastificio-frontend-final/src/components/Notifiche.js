// src/components/Notifiche.js
import React, { useEffect, useState } from 'react';
import NotificheManager from './notifiche/NotificheManager';

const Notifiche = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px' 
      }}>
        Caricamento...
      </div>
    );
  }

  return <NotificheManager />;
};

export default Notifiche;
'use client';  // ✅ NECESSARIO per Next.js 13 App Router

// components/GlobalPopups.js
// ✅ POPUP HACCP GLOBALI - FUNZIONANO SU TUTTE LE PAGINE
import { useState, useEffect } from 'react';
import HACCPAutoPopup from './HACCPAutoPopup';
import PuliziaAutoPopup from './PuliziaAutoPopup';

export default function GlobalPopups() {
  const [testHACCPPopupOpen, setTestHACCPPopupOpen] = useState(false);
  const [testPuliziaPopupOpen, setTestPuliziaPopupOpen] = useState(false);

  // ============================================
  // ✨ POPUP AUTOMATICO TEMPERATURE - Martedì 9:00
  // ============================================
  useEffect(() => {
    const checkAutoPopup = () => {
      const ora = new Date();
      const giornoSettimana = ora.getDay();
      const ore = ora.getHours();
      const minuti = ora.getMinutes();
      
      console.log(`🕐 [HACCP Auto] Controllo automatico: ${["Domenica","Lunedi","Martedi","Mercoledi","Giovedi","Venerdi","Sabato"][giornoSettimana]} ore ${ore}:${minuti.toString().padStart(2,'0')}`);
      
      // ✅ Martedì ore 9:00-9:59
      if (giornoSettimana === 2 && ore === 9) {
        console.log('✅ [HACCP Auto] È Martedì ore 9!');
        
        const ultimoShow = localStorage.getItem('haccp_last_popup_show');
        const oggi = new Date().toISOString().split('T')[0];
        
        if (ultimoShow === oggi) {
          console.log('ℹ️ [HACCP Auto] Popup già mostrato oggi, skip');
          return;
        }
        
        console.log('🌡️ [HACCP Auto] Apro popup automaticamente!');
        localStorage.setItem('haccp_last_popup_show', oggi);
        setTestHACCPPopupOpen(true);
      } else {
        console.log(`ℹ️ [HACCP Auto] Condizioni non soddisfatte (Giorno: ${giornoSettimana}, Ora: ${ore})`);
      }
    };
    
    checkAutoPopup();
    const interval = setInterval(checkAutoPopup, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // ============================================
  // ✨ POPUP AUTOMATICO PULIZIE
  // Giornaliero: Lun-Sab 18:00
  // Settimanale: Domenica 10:00
  // ============================================
  useEffect(() => {
    const checkAutoPuliziaPopup = () => {
      const ora = new Date();
      const giornoSettimana = ora.getDay();
      const ore = ora.getHours();
      const minuti = ora.getMinutes();
      
      console.log(`🧹 [Pulizia Auto] Controllo automatico: ${["Domenica","Lunedi","Martedi","Mercoledi","Giovedi","Venerdi","Sabato"][giornoSettimana]} ore ${ore}:${minuti.toString().padStart(2,'0')}`);
      
      let shouldShow = false;
      let tipoPulizia = 'giornaliera';
      
      // ✅ SETTIMANALI: Domenica 10:00
      if (giornoSettimana === 0 && ore === 10) {
        console.log('✅ [Pulizia Auto] È Domenica ore 10! Pulizie SETTIMANALI');
        shouldShow = true;
        tipoPulizia = 'settimanale';
      }
      // ✅ GIORNALIERE: Lun-Sab 18:00
      else if (giornoSettimana >= 1 && giornoSettimana <= 6 && ore === 18) {
        console.log('✅ [Pulizia Auto] Ore 18 giorni lavorativi! Pulizie GIORNALIERE');
        shouldShow = true;
        tipoPulizia = 'giornaliera';
      }
      
      if (!shouldShow) {
        console.log(`ℹ️ [Pulizia Auto] Condizioni non soddisfatte (Giorno: ${giornoSettimana}, Ora: ${ore})`);
        return;
      }
      
      const storageKey = `pulizia_last_popup_${tipoPulizia}`;
      const ultimoShow = localStorage.getItem(storageKey);
      const oggi = new Date().toISOString().split('T')[0];
      
      if (ultimoShow === oggi) {
        console.log(`ℹ️ [Pulizia Auto] Popup ${tipoPulizia} già mostrato oggi, skip`);
        return;
      }
      
      console.log(`🧹 [Pulizia Auto] Apro popup pulizie ${tipoPulizia.toUpperCase()}!`);
      localStorage.setItem(storageKey, oggi);
      setTestPuliziaPopupOpen(true);
    };
    
    checkAutoPuliziaPopup();
    const interval = setInterval(checkAutoPuliziaPopup, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // ============================================
  // RENDER POPUP
  // ============================================
  return (
    <>
      {/* Popup Temperature */}
      {testHACCPPopupOpen && (
        <HACCPAutoPopup 
          onClose={() => {
            setTestHACCPPopupOpen(false);
            if (typeof window !== 'undefined') {
              window.location.reload();
            }
          }}
          forceShow={true}
        />
      )}

      {/* Popup Pulizie */}
      {testPuliziaPopupOpen && (
        <PuliziaAutoPopup 
          onClose={() => {
            setTestPuliziaPopupOpen(false);
            if (typeof window !== 'undefined') {
              window.location.reload();
            }
          }}
          forceShow={true}
        />
      )}
    </>
  );
}
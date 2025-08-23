// src/components/Notifiche/PreferenzeNotifiche.js
import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Alert, AlertDescription } from "../ui/alert";
import { Save, Bell, Mail, MessageSquare, Clock } from 'lucide-react';
import loggingService from '../../services/loggingService';

const PreferenzeNotifiche = ({ onSave, showAlert, preferenzeIniziali }) => {
  const [preferenze, setPreferenze] = useState({
    email: {
      abilitato: true,
      nuovoOrdine: true,
      modificaOrdine: true,
      cancellazioneOrdine: false,
      reportGiornaliero: true,
      alertScorte: true,
      indirizzi: ['']
    },
    push: {
      abilitato: true,
      nuovoOrdine: true,
      modificaOrdine: false,
      cancellazioneOrdine: false,
      alertScorte: true
    },
    sms: {
      abilitato: false,
      nuovoOrdine: true,
      modificaOrdine: false,
      cancellazioneOrdine: false,
      numeroTelefono: ''
    },
    orariNotifiche: {
      inizioGiornata: '08:00',
      fineGiornata: '20:00',
      giorniSettimana: [1, 2, 3, 4, 5] // Lun-Ven
    }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (preferenzeIniziali) {
      setPreferenze(preferenzeIniziali);
    } else {
      caricaPreferenze();
    }
  }, [preferenzeIniziali]);

  const caricaPreferenze = async () => {
    try {
      const savedPreferences = localStorage.getItem('notificationPreferences');
      if (savedPreferences) {
        setPreferenze(JSON.parse(savedPreferences));
      }
    } catch (error) {
      console.error('Errore nel caricamento delle preferenze:', error);
      setError('Errore nel caricamento delle preferenze');
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Validazione email - filtra solo email valide o vuote
      const emailValidi = preferenze.email.indirizzi.filter(email => {
        if (!email || email.trim() === '') return false;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email.trim());
      });

      // Se email è abilitato ma non ci sono email validi, usa un array vuoto ma non bloccare
      const preferenzeDaSalvare = {
        ...preferenze,
        email: {
          ...preferenze.email,
          indirizzi: emailValidi.length > 0 ? emailValidi : [''] // Mantieni almeno un campo vuoto
        }
      };

      // Validazione SMS solo se abilitato
      if (preferenze.sms.abilitato && !preferenze.sms.numeroTelefono) {
        // Non bloccare, solo disabilita SMS
        preferenzeDaSalvare.sms.abilitato = false;
      }

      // Salva in localStorage
      localStorage.setItem('notificationPreferences', JSON.stringify(preferenzeDaSalvare));
      
      // Log dell'azione
      loggingService.log('info', 'Preferenze notifiche aggiornate', { preferenze: preferenzeDaSalvare });
      
      // Chiama la callback se fornita
      if (onSave) {
        await onSave(preferenzeDaSalvare);
      }
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      
      if (showAlert) {
        showAlert('Preferenze salvate con successo!', 'success');
      }
    } catch (error) {
      console.error('Errore nel salvataggio delle preferenze:', error);
      setError(error.message || 'Errore nel salvataggio delle preferenze');
      if (showAlert) {
        showAlert(error.message || 'Errore nel salvataggio', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (categoria, campo) => {
    setPreferenze(prev => ({
      ...prev,
      [categoria]: {
        ...prev[categoria],
        [campo]: !prev[categoria][campo]
      }
    }));
  };

  const handleEmailChange = (index, value) => {
    setPreferenze(prev => {
      const newEmails = [...prev.email.indirizzi];
      newEmails[index] = value;
      return {
        ...prev,
        email: {
          ...prev.email,
          indirizzi: newEmails
        }
      };
    });
  };

  const addEmail = () => {
    setPreferenze(prev => ({
      ...prev,
      email: {
        ...prev.email,
        indirizzi: [...prev.email.indirizzi, '']
      }
    }));
  };

  const removeEmail = (index) => {
    if (preferenze.email.indirizzi.length > 1) {
      setPreferenze(prev => ({
        ...prev,
        email: {
          ...prev.email,
          indirizzi: prev.email.indirizzi.filter((_, i) => i !== index)
        }
      }));
    }
  };

  const handleGiorniChange = (giorno) => {
    setPreferenze(prev => {
      const giorni = prev.orariNotifiche.giorniSettimana;
      const index = giorni.indexOf(giorno);
      if (index > -1) {
        return {
          ...prev,
          orariNotifiche: {
            ...prev.orariNotifiche,
            giorniSettimana: giorni.filter(g => g !== giorno)
          }
        };
      } else {
        return {
          ...prev,
          orariNotifiche: {
            ...prev.orariNotifiche,
            giorniSettimana: [...giorni, giorno].sort()
          }
        };
      }
    });
  };

  const giorni = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Preferenze Notifiche
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Notifiche Email */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              <h3 className="font-semibold">Email</h3>
            </div>
            <Switch
              checked={preferenze.email.abilitato}
              onCheckedChange={() => handleToggle('email', 'abilitato')}
            />
          </div>
          
          {preferenze.email.abilitato && (
            <div className="ml-7 space-y-3">
              <div className="space-y-2">
                <Label>Notifica per:</Label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={preferenze.email.nuovoOrdine}
                      onChange={() => handleToggle('email', 'nuovoOrdine')}
                      className="rounded"
                    />
                    <span>Nuovo ordine</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={preferenze.email.modificaOrdine}
                      onChange={() => handleToggle('email', 'modificaOrdine')}
                      className="rounded"
                    />
                    <span>Modifica ordine</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={preferenze.email.reportGiornaliero}
                      onChange={() => handleToggle('email', 'reportGiornaliero')}
                      className="rounded"
                    />
                    <span>Report giornaliero</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={preferenze.email.alertScorte}
                      onChange={() => handleToggle('email', 'alertScorte')}
                      className="rounded"
                    />
                    <span>Alert scorte basse</span>
                  </label>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Indirizzi email:</Label>
                {preferenze.email.indirizzi.map((email, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => handleEmailChange(index, e.target.value)}
                      placeholder="email@esempio.com"
                      className="flex-1"
                    />
                    {preferenze.email.indirizzi.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeEmail(index)}
                      >
                        Rimuovi
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addEmail}
                >
                  Aggiungi email
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Notifiche Push */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <h3 className="font-semibold">Push</h3>
            </div>
            <Switch
              checked={preferenze.push.abilitato}
              onCheckedChange={() => handleToggle('push', 'abilitato')}
            />
          </div>
          
          {preferenze.push.abilitato && (
            <div className="ml-7 space-y-2">
              <Label>Notifica per:</Label>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={preferenze.push.nuovoOrdine}
                    onChange={() => handleToggle('push', 'nuovoOrdine')}
                    className="rounded"
                  />
                  <span>Nuovo ordine</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={preferenze.push.alertScorte}
                    onChange={() => handleToggle('push', 'alertScorte')}
                    className="rounded"
                  />
                  <span>Alert scorte basse</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Notifiche SMS */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              <h3 className="font-semibold">SMS</h3>
            </div>
            <Switch
              checked={preferenze.sms.abilitato}
              onCheckedChange={() => handleToggle('sms', 'abilitato')}
            />
          </div>
          
          {preferenze.sms.abilitato && (
            <div className="ml-7 space-y-3">
              <div className="space-y-2">
                <Label>Numero di telefono:</Label>
                <Input
                  type="tel"
                  value={preferenze.sms.numeroTelefono}
                  onChange={(e) => setPreferenze(prev => ({
                    ...prev,
                    sms: {
                      ...prev.sms,
                      numeroTelefono: e.target.value
                    }
                  }))}
                  placeholder="+39 123 456 7890"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Notifica per:</Label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={preferenze.sms.nuovoOrdine}
                      onChange={() => handleToggle('sms', 'nuovoOrdine')}
                      className="rounded"
                    />
                    <span>Nuovo ordine</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Orari Notifiche */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            <h3 className="font-semibold">Orari Notifiche</h3>
          </div>
          
          <div className="ml-7 space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Inizio giornata:</Label>
                <Input
                  type="time"
                  value={preferenze.orariNotifiche.inizioGiornata}
                  onChange={(e) => setPreferenze(prev => ({
                    ...prev,
                    orariNotifiche: {
                      ...prev.orariNotifiche,
                      inizioGiornata: e.target.value
                    }
                  }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Fine giornata:</Label>
                <Input
                  type="time"
                  value={preferenze.orariNotifiche.fineGiornata}
                  onChange={(e) => setPreferenze(prev => ({
                    ...prev,
                    orariNotifiche: {
                      ...prev.orariNotifiche,
                      fineGiornata: e.target.value
                    }
                  }))}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Giorni attivi:</Label>
              <div className="flex gap-2 flex-wrap">
                {giorni.map((giorno, index) => (
                  <button
                    key={index}
                    onClick={() => handleGiorniChange(index)}
                    className={`px-3 py-1 rounded transition-colors ${
                      preferenze.orariNotifiche.giorniSettimana.includes(index)
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 hover:bg-gray-300'
                    }`}
                  >
                    {giorno}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Messaggi di stato */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert>
            <AlertDescription>Preferenze salvate con successo!</AlertDescription>
          </Alert>
        )}

        {/* Pulsante Salva */}
        <Button
          onClick={handleSave}
          disabled={loading}
          className="w-full"
        >
          <Save className="h-4 w-4 mr-2" />
          {loading ? 'Salvataggio...' : 'Salva Preferenze'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default PreferenzeNotifiche;
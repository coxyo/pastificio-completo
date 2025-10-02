// src/components/ConfigurazionePannello.js
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Save, 
  Download, 
  Upload, 
  RefreshCw,
  Settings,
  Database,
  Wifi,
  WifiOff,
  CheckCircle,
  AlertCircle,
  Shield,
  Bell,
  Mail,
  MessageSquare,
  Calendar,
  Clock,
  Palette
} from 'lucide-react';
import { LoggingService } from '@/services/loggingService'; // Corretto l'import
import { BackupService } from '@/services/backupService';  // Aggiunto import

const ConfigurazionePannello = () => {
  const [config, setConfig] = useState({
    azienda: {
      nome: 'Pastificio Nonna Claudia',
      indirizzo: 'Via Roma 123',
      telefono: '+39 123 456789',
      email: 'info@pastificiononna.it',
      piva: '12345678901',
      logo: null
    },
    sistema: {
      sincronizzazione: true,
      intervalloSync: 10000,
      backupAutomatico: true,
      orarioBackup: '02:00',
      modalitaOffline: true,
      cache: true,
      logging: true,
      debug: false
    },
    notifiche: {
      email: true,
      whatsapp: true,
      push: false,
      ordiniNuovi: true,
      scorteMinime: true,
      scadenze: true,
      backup: true
    },
    interfaccia: {
      tema: 'light',
      lingua: 'it',
      formatoData: 'DD/MM/YYYY',
      formatoOra: 'HH:mm',
      valuta: 'EUR',
      decimali: 2
    },
    sicurezza: {
      autenticazione: true,
      sessioneMinuti: 60,
      passwordComplessa: true,
      backup2FA: false
    }
  });

  const [saveStatus, setSaveStatus] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('online');

  useEffect(() => {
    // Carica configurazione salvata
    const savedConfig = localStorage.getItem('app_config');
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig));
    }

    // Monitora connessione
    const handleOnline = () => setConnectionStatus('online');
    const handleOffline = () => setConnectionStatus('offline');
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSave = async () => {
    try {
      // Salva in localStorage
      localStorage.setItem('app_config', JSON.stringify(config));
      
      // Salva sul server
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://pastificio-backend.onrender.com';
      const response = await fetch(`${apiUrl}/api/config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || 'demo-token'}`
        },
        body: JSON.stringify(config)
      });

      if (response.ok) {
        setSaveStatus('success');
        LoggingService.success('Configurazione salvata', config);
      } else {
        setSaveStatus('error');
        LoggingService.error('Errore salvataggio configurazione');
      }
    } catch (error) {
      setSaveStatus('error');
      LoggingService.error('Errore salvataggio:', error);
    }

    setTimeout(() => setSaveStatus(''), 3000);
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(config, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `config-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    LoggingService.info('Configurazione esportata');
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const importedConfig = JSON.parse(event.target.result);
          setConfig(importedConfig);
          LoggingService.info('Configurazione importata');
          setSaveStatus('imported');
          setTimeout(() => setSaveStatus(''), 3000);
        } catch (error) {
          LoggingService.error('Errore importazione:', error);
          setSaveStatus('error');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleBackupNow = async () => {
    try {
      await BackupService.createBackup();
      setSaveStatus('backup_success');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      LoggingService.error('Errore backup:', error);
      setSaveStatus('backup_error');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="w-6 h-6" />
              Configurazione Sistema
            </div>
            <div className="flex items-center gap-2">
              {connectionStatus === 'online' ? (
                <div className="flex items-center gap-1 text-green-600">
                  <Wifi className="w-4 h-4" />
                  <span className="text-sm">Online</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-orange-600">
                  <WifiOff className="w-4 h-4" />
                  <span className="text-sm">Offline</span>
                </div>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="azienda">
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="azienda">Azienda</TabsTrigger>
              <TabsTrigger value="sistema">Sistema</TabsTrigger>
              <TabsTrigger value="notifiche">Notifiche</TabsTrigger>
              <TabsTrigger value="interfaccia">Interfaccia</TabsTrigger>
              <TabsTrigger value="sicurezza">Sicurezza</TabsTrigger>
            </TabsList>

            <TabsContent value="azienda" className="space-y-4">
              <div>
                <Label htmlFor="nome">Nome Azienda</Label>
                <Input
                  id="nome"
                  value={config.azienda.nome}
                  onChange={(e) => setConfig({
                    ...config,
                    azienda: { ...config.azienda, nome: e.target.value }
                  })}
                />
              </div>
              <div>
                <Label htmlFor="indirizzo">Indirizzo</Label>
                <Input
                  id="indirizzo"
                  value={config.azienda.indirizzo}
                  onChange={(e) => setConfig({
                    ...config,
                    azienda: { ...config.azienda, indirizzo: e.target.value }
                  })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="telefono">Telefono</Label>
                  <Input
                    id="telefono"
                    value={config.azienda.telefono}
                    onChange={(e) => setConfig({
                      ...config,
                      azienda: { ...config.azienda, telefono: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={config.azienda.email}
                    onChange={(e) => setConfig({
                      ...config,
                      azienda: { ...config.azienda, email: e.target.value }
                    })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="piva">Partita IVA</Label>
                <Input
                  id="piva"
                  value={config.azienda.piva}
                  onChange={(e) => setConfig({
                    ...config,
                    azienda: { ...config.azienda, piva: e.target.value }
                  })}
                />
              </div>
            </TabsContent>

            <TabsContent value="sistema" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Sincronizzazione Automatica</Label>
                    <p className="text-sm text-gray-500">
                      Sincronizza dati tra dispositivi
                    </p>
                  </div>
                  <Switch
                    checked={config.sistema.sincronizzazione}
                    onCheckedChange={(checked) => setConfig({
                      ...config,
                      sistema: { ...config.sistema, sincronizzazione: checked }
                    })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Backup Automatico</Label>
                    <p className="text-sm text-gray-500">
                      Backup giornaliero alle {config.sistema.orarioBackup}
                    </p>
                  </div>
                  <Switch
                    checked={config.sistema.backupAutomatico}
                    onCheckedChange={(checked) => setConfig({
                      ...config,
                      sistema: { ...config.sistema, backupAutomatico: checked }
                    })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Modalità Offline</Label>
                    <p className="text-sm text-gray-500">
                      Funziona anche senza connessione
                    </p>
                  </div>
                  <Switch
                    checked={config.sistema.modalitaOffline}
                    onCheckedChange={(checked) => setConfig({
                      ...config,
                      sistema: { ...config.sistema, modalitaOffline: checked }
                    })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Cache Locale</Label>
                    <p className="text-sm text-gray-500">
                      Migliora le prestazioni
                    </p>
                  </div>
                  <Switch
                    checked={config.sistema.cache}
                    onCheckedChange={(checked) => setConfig({
                      ...config,
                      sistema: { ...config.sistema, cache: checked }
                    })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Logging</Label>
                    <p className="text-sm text-gray-500">
                      Registra attività sistema
                    </p>
                  </div>
                  <Switch
                    checked={config.sistema.logging}
                    onCheckedChange={(checked) => setConfig({
                      ...config,
                      sistema: { ...config.sistema, logging: checked }
                    })}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="notifiche" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <div>
                      <Label>Email</Label>
                      <p className="text-sm text-gray-500">Notifiche via email</p>
                    </div>
                  </div>
                  <Switch
                    checked={config.notifiche.email}
                    onCheckedChange={(checked) => setConfig({
                      ...config,
                      notifiche: { ...config.notifiche, email: checked }
                    })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    <div>
                      <Label>WhatsApp</Label>
                      <p className="text-sm text-gray-500">Notifiche WhatsApp</p>
                    </div>
                  </div>
                  <Switch
                    checked={config.notifiche.whatsapp}
                    onCheckedChange={(checked) => setConfig({
                      ...config,
                      notifiche: { ...config.notifiche, whatsapp: checked }
                    })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4" />
                    <div>
                      <Label>Push</Label>
                      <p className="text-sm text-gray-500">Notifiche browser</p>
                    </div>
                  </div>
                  <Switch
                    checked={config.notifiche.push}
                    onCheckedChange={(checked) => setConfig({
                      ...config,
                      notifiche: { ...config.notifiche, push: checked }
                    })}
                  />
                </div>

                <hr />

                <div className="flex items-center justify-between">
                  <Label>Nuovi Ordini</Label>
                  <Switch
                    checked={config.notifiche.ordiniNuovi}
                    onCheckedChange={(checked) => setConfig({
                      ...config,
                      notifiche: { ...config.notifiche, ordiniNuovi: checked }
                    })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Scorte Minime</Label>
                  <Switch
                    checked={config.notifiche.scorteMinime}
                    onCheckedChange={(checked) => setConfig({
                      ...config,
                      notifiche: { ...config.notifiche, scorteMinime: checked }
                    })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Scadenze Prodotti</Label>
                  <Switch
                    checked={config.notifiche.scadenze}
                    onCheckedChange={(checked) => setConfig({
                      ...config,
                      notifiche: { ...config.notifiche, scadenze: checked }
                    })}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="interfaccia" className="space-y-4">
              <div>
                <Label>Tema</Label>
                <select
                  className="w-full p-2 border rounded"
                  value={config.interfaccia.tema}
                  onChange={(e) => setConfig({
                    ...config,
                    interfaccia: { ...config.interfaccia, tema: e.target.value }
                  })}
                >
                  <option value="light">Chiaro</option>
                  <option value="dark">Scuro</option>
                  <option value="auto">Automatico</option>
                </select>
              </div>

              <div>
                <Label>Lingua</Label>
                <select
                  className="w-full p-2 border rounded"
                  value={config.interfaccia.lingua}
                  onChange={(e) => setConfig({
                    ...config,
                    interfaccia: { ...config.interfaccia, lingua: e.target.value }
                  })}
                >
                  <option value="it">Italiano</option>
                  <option value="en">English</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Formato Data</Label>
                  <select
                    className="w-full p-2 border rounded"
                    value={config.interfaccia.formatoData}
                    onChange={(e) => setConfig({
                      ...config,
                      interfaccia: { ...config.interfaccia, formatoData: e.target.value }
                    })}
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>

                <div>
                  <Label>Formato Ora</Label>
                  <select
                    className="w-full p-2 border rounded"
                    value={config.interfaccia.formatoOra}
                    onChange={(e) => setConfig({
                      ...config,
                      interfaccia: { ...config.interfaccia, formatoOra: e.target.value }
                    })}
                  >
                    <option value="HH:mm">24 ore</option>
                    <option value="hh:mm A">12 ore</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Valuta</Label>
                  <select
                    className="w-full p-2 border rounded"
                    value={config.interfaccia.valuta}
                    onChange={(e) => setConfig({
                      ...config,
                      interfaccia: { ...config.interfaccia, valuta: e.target.value }
                    })}
                  >
                    <option value="EUR">€ Euro</option>
                    <option value="USD">$ Dollaro</option>
                    <option value="GBP">£ Sterlina</option>
                  </select>
                </div>

                <div>
                  <Label>Decimali</Label>
                  <select
                    className="w-full p-2 border rounded"
                    value={config.interfaccia.decimali}
                    onChange={(e) => setConfig({
                      ...config,
                      interfaccia: { ...config.interfaccia, decimali: parseInt(e.target.value) }
                    })}
                  >
                    <option value="0">0</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                  </select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="sicurezza" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    <div>
                      <Label>Autenticazione Obbligatoria</Label>
                      <p className="text-sm text-gray-500">
                        Richiedi login per accedere
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={config.sicurezza.autenticazione}
                    onCheckedChange={(checked) => setConfig({
                      ...config,
                      sicurezza: { ...config.sicurezza, autenticazione: checked }
                    })}
                  />
                </div>

                <div>
                  <Label>Timeout Sessione (minuti)</Label>
                  <Input
                    type="number"
                    value={config.sicurezza.sessioneMinuti}
                    onChange={(e) => setConfig({
                      ...config,
                      sicurezza: { ...config.sicurezza, sessioneMinuti: parseInt(e.target.value) }
                    })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Password Complesse</Label>
                    <p className="text-sm text-gray-500">
                      Richiedi almeno 8 caratteri, numeri e simboli
                    </p>
                  </div>
                  <Switch
                    checked={config.sicurezza.passwordComplessa}
                    onCheckedChange={(checked) => setConfig({
                      ...config,
                      sicurezza: { ...config.sicurezza, passwordComplessa: checked }
                    })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Autenticazione 2FA</Label>
                    <p className="text-sm text-gray-500">
                      Richiedi codice aggiuntivo
                    </p>
                  </div>
                  <Switch
                    checked={config.sicurezza.backup2FA}
                    onCheckedChange={(checked) => setConfig({
                      ...config,
                      sicurezza: { ...config.sicurezza, backup2FA: checked }
                    })}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-6 flex justify-between">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleExport}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Esporta
              </Button>
              
              <label>
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  asChild
                >
                  <span>
                    <Upload className="w-4 h-4" />
                    Importa
                  </span>
                </Button>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>

              <Button
                variant="outline"
                onClick={handleBackupNow}
                className="flex items-center gap-2"
              >
                <Database className="w-4 h-4" />
                Backup Ora
              </Button>
            </div>

            <Button
              onClick={handleSave}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Salva Configurazione
            </Button>
          </div>

          {saveStatus && (
            <Alert className="mt-4">
              <AlertDescription>
                {saveStatus === 'success' && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    Configurazione salvata con successo
                  </div>
                )}
                {saveStatus === 'error' && (
                  <div className="flex items-center gap-2 text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    Errore nel salvataggio della configurazione
                  </div>
                )}
                {saveStatus === 'imported' && (
                  <div className="flex items-center gap-2 text-blue-600">
                    <CheckCircle className="w-4 h-4" />
                    Configurazione importata con successo
                  </div>
                )}
                {saveStatus === 'backup_success' && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    Backup completato con successo
                  </div>
                )}
                {saveStatus === 'backup_error' && (
                  <div className="flex items-center gap-2 text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    Errore durante il backup
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ConfigurazionePannello;

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Alert, AlertDescription } from "./ui/alert";

interface ConfigurazioneGenerale {
  nomePastificio: string;
  indirizzo: string;
  telefono: string;
  email: string;
  piva: string;
  logo: string;
}

interface ConfigurazioneOrari {
  lunedi: { apertura: string; chiusura: string; chiuso: boolean };
  martedi: { apertura: string; chiusura: string; chiuso: boolean };
  mercoledi: { apertura: string; chiusura: string; chiuso: boolean };
  giovedi: { apertura: string; chiusura: string; chiuso: boolean };
  venerdi: { apertura: string; chiusura: string; chiuso: boolean };
  sabato: { apertura: string; chiusura: string; chiuso: boolean };
  domenica: { apertura: string; chiusura: string; chiuso: boolean };
}

interface ConfigurazioneBackup {
  autoBackup: boolean;
  frequenza: string;
  percorsoBackup: string;
  mantieniUltimi: number;
}

interface ConfigurazioneNotifiche {
  emailNotifiche: boolean;
  emailDestinatario: string;
  notificheOrdiniNuovi: boolean;
  notificheOrdiniCompletati: boolean;
  notificheScorteBasse: boolean;
}

const ConfigurazionePannello: React.FC = () => {
  // Stati per le diverse configurazioni
  const [configGenerale, setConfigGenerale] = useState<ConfigurazioneGenerale>({
    nomePastificio: "Pastificio Nonna Claudia",
    indirizzo: "Via Roma 123, Cagliari",
    telefono: "070 123456",
    email: "info@pastificononna.it",
    piva: "IT12345678901",
    logo: "/logo.png"
  });
  
  const [configOrari, setConfigOrari] = useState<ConfigurazioneOrari>({
    lunedi: { apertura: "08:00", chiusura: "19:00", chiuso: false },
    martedi: { apertura: "08:00", chiusura: "19:00", chiuso: false },
    mercoledi: { apertura: "08:00", chiusura: "19:00", chiuso: false },
    giovedi: { apertura: "08:00", chiusura: "19:00", chiuso: false },
    venerdi: { apertura: "08:00", chiusura: "19:00", chiuso: false },
    sabato: { apertura: "08:00", chiusura: "14:00", chiuso: false },
    domenica: { apertura: "08:00", chiusura: "13:00", chiuso: true }
  });
  
  const [configBackup, setConfigBackup] = useState<ConfigurazioneBackup>({
    autoBackup: true,
    frequenza: "giornaliera",
    percorsoBackup: "/backups",
    mantieniUltimi: 7
  });
  
  const [configNotifiche, setConfigNotifiche] = useState<ConfigurazioneNotifiche>({
    emailNotifiche: true,
    emailDestinatario: "info@pastificononna.it",
    notificheOrdiniNuovi: true,
    notificheOrdiniCompletati: true,
    notificheScorteBasse: true
  });
  
  // Stati per feedback utente
  const [salvato, setSalvato] = useState(false);
  const [errore, setErrore] = useState("");
  
  // Handler per i cambiamenti della configurazione generale
  const handleGeneraleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfigGenerale({
      ...configGenerale,
      [e.target.name]: e.target.value
    });
  };
  
  // Handler per i cambiamenti degli orari
  const handleOrariChange = (giorno: keyof ConfigurazioneOrari, campo: 'apertura' | 'chiusura' | 'chiuso', valore: string | boolean) => {
    setConfigOrari({
      ...configOrari,
      [giorno]: {
        ...configOrari[giorno],
        [campo]: valore
      }
    });
  };
  
  // Handler per i cambiamenti delle configurazioni di backup
  const handleBackupChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox'
      ? (e as React.ChangeEvent<HTMLInputElement>).target.checked
      : e.target.value;
    
    setConfigBackup({
      ...configBackup,
      [e.target.name]: value
    });
  };
  
  // Handler per i cambiamenti delle configurazioni di notifica
  const handleNotificheChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, type, checked, value } = e.target;
    
    setConfigNotifiche({
      ...configNotifiche,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  // Funzione per salvare le configurazioni
  const salvaConfigurazioni = useCallback(async () => {
    try {
      // Simulazione salvataggio configurazioni
      console.log('Salvataggio configurazioni...', {
        generale: configGenerale,
        orari: configOrari,
        backup: configBackup,
        notifiche: configNotifiche
      });
      
      // Simulazione attesa risposta dal server
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Feedback successo
      setSalvato(true);
      setErrore("");
      
      // Reset feedback dopo 3 secondi
      setTimeout(() => setSalvato(false), 3000);
    } catch (error) {
      console.error('Errore durante il salvataggio:', error);
      setErrore("Si è verificato un errore durante il salvataggio delle configurazioni.");
    }
  }, [configGenerale, configOrari, configBackup, configNotifiche]);
  
  // Funzione per eseguire backup manuale
  const eseguiBackupManuale = useCallback(async () => {
    try {
      console.log('Esecuzione backup manuale...');
      
      // Simulazione attesa risposta dal server
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Feedback successo
      setSalvato(true);
      setErrore("");
      
      // Reset feedback dopo 3 secondi
      setTimeout(() => setSalvato(false), 3000);
    } catch (error) {
      console.error('Errore durante il backup manuale:', error);
      setErrore("Si è verificato un errore durante l'esecuzione del backup manuale.");
    }
  }, []);
  
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Configurazione Sistema</h1>
      
      {/* Feedback */}
      {salvato && (
        <Alert className="mb-4 bg-green-50 border-green-400">
          <AlertDescription>
            Configurazioni salvate con successo!
          </AlertDescription>
        </Alert>
      )}
      
      {errore && (
        <Alert className="mb-4 bg-red-50 border-red-400">
          <AlertDescription>
            {errore}
          </AlertDescription>
        </Alert>
      )}
      
      <Tabs defaultValue="generale">
        <TabsList className="mb-4">
          <TabsTrigger value="generale">Generale</TabsTrigger>
          <TabsTrigger value="orari">Orari e Disponibilità</TabsTrigger>
          <TabsTrigger value="backup">Backup</TabsTrigger>
          <TabsTrigger value="notifiche">Notifiche</TabsTrigger>
        </TabsList>
        
        {/* Configurazione Generale */}
        <TabsContent value="generale">
          <Card>
            <CardHeader>
              <CardTitle>Informazioni Generali</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nomePastificio">Nome Pastificio</Label>
                    <Input
                      id="nomePastificio"
                      name="nomePastificio"
                      value={configGenerale.nomePastificio}
                      onChange={handleGeneraleChange}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="piva">Partita IVA</Label>
                    <Input
                      id="piva"
                      name="piva"
                      value={configGenerale.piva}
                      onChange={handleGeneraleChange}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="indirizzo">Indirizzo</Label>
                  <Input
                    id="indirizzo"
                    name="indirizzo"
                    value={configGenerale.indirizzo}
                    onChange={handleGeneraleChange}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="telefono">Telefono</Label>
                    <Input
                      id="telefono"
                      name="telefono"
                      value={configGenerale.telefono}
                      onChange={handleGeneraleChange}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={configGenerale.email}
                      onChange={handleGeneraleChange}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="logo">Logo (URL)</Label>
                  <Input
                    id="logo"
                    name="logo"
                    value={configGenerale.logo}
                    onChange={handleGeneraleChange}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Configurazione Orari */}
        <TabsContent value="orari">
          <Card>
            <CardHeader>
              <CardTitle>Orari e Disponibilità</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(Object.keys(configOrari) as Array<keyof ConfigurazioneOrari>).map(giorno => (
                  <div key={giorno} className="flex items-center space-x-4">
                    <div className="w-24 font-medium">{giorno.charAt(0).toUpperCase() + giorno.slice(1)}</div>
                    
                    <div className="flex items-center space-x-2">
                      <Label htmlFor={`${giorno}-chiuso`} className="mr-2">Chiuso</Label>
                      <Switch
                        id={`${giorno}-chiuso`}
                        checked={configOrari[giorno].chiuso}
                        onCheckedChange={(checked) => handleOrariChange(giorno, 'chiuso', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Label htmlFor={`${giorno}-apertura`} className="mr-2">Apertura</Label>
                      <Input
                        id={`${giorno}-apertura`}
                        type="time"
                        value={configOrari[giorno].apertura}
                        onChange={(e) => handleOrariChange(giorno, 'apertura', e.target.value)}
                        disabled={configOrari[giorno].chiuso}
                        className="w-32"
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Label htmlFor={`${giorno}-chiusura`} className="mr-2">Chiusura</Label>
                      <Input
                        id={`${giorno}-chiusura`}
                        type="time"
                        value={configOrari[giorno].chiusura}
                        onChange={(e) => handleOrariChange(giorno, 'chiusura', e.target.value)}
                        disabled={configOrari[giorno].chiuso}
                        className="w-32"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Configurazione Backup */}
        <TabsContent value="backup">
          <Card>
            <CardHeader>
              <CardTitle>Backup Automatico</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="autoBackup"
                    name="autoBackup"
                    checked={configBackup.autoBackup}
                    onCheckedChange={(checked) => setConfigBackup({...configBackup, autoBackup: checked})}
                  />
                  <Label htmlFor="autoBackup">Abilita backup automatico</Label>
                </div>
                
                <div>
                  <Label htmlFor="frequenza">Frequenza Backup</Label>
                  <select
                    id="frequenza"
                    name="frequenza"
                    value={configBackup.frequenza}
                    onChange={handleBackupChange}
                    disabled={!configBackup.autoBackup}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="giornaliera">Giornaliera</option>
                    <option value="settimanale">Settimanale</option>
                    <option value="mensile">Mensile</option>
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="percorsoBackup">Percorso Backup</Label>
                  <Input
                    id="percorsoBackup"
                    name="percorsoBackup"
                    value={configBackup.percorsoBackup}
                    onChange={handleBackupChange}
                    disabled={!configBackup.autoBackup}
                  />
                </div>
                
                <div>
                  <Label htmlFor="mantieniUltimi">Mantieni ultimi backup</Label>
                  <Input
                    id="mantieniUltimi"
                    name="mantieniUltimi"
                    type="number"
                    min="1"
                    max="30"
                    value={configBackup.mantieniUltimi}
                    onChange={handleBackupChange}
                    disabled={!configBackup.autoBackup}
                  />
                </div>
                
                <div className="mt-6">
                  <Button onClick={eseguiBackupManuale} variant="outline">
                    Esegui Backup Manuale
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Configurazione Notifiche */}
        <TabsContent value="notifiche">
          <Card>
            <CardHeader>
              <CardTitle>Notifiche e Alert</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="emailNotifiche"
                    name="emailNotifiche"
                    checked={configNotifiche.emailNotifiche}
                    onCheckedChange={(checked) => setConfigNotifiche({...configNotifiche, emailNotifiche: checked})}
                  />
                  <Label htmlFor="emailNotifiche">Abilita notifiche email</Label>
                </div>
                
                <div>
                  <Label htmlFor="emailDestinatario">Email destinatario</Label>
                  <Input
                    id="emailDestinatario"
                    name="emailDestinatario"
                    type="email"
                    value={configNotifiche.emailDestinatario}
                    onChange={handleNotificheChange}
                    disabled={!configNotifiche.emailNotifiche}
                  />
                </div>
                
                <div className="space-y-2 pt-2">
                  <h4 className="font-medium">Tipi di notifiche</h4>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="notificheOrdiniNuovi"
                      name="notificheOrdiniNuovi"
                      checked={configNotifiche.notificheOrdiniNuovi}
                      onCheckedChange={(checked) => setConfigNotifiche({...configNotifiche, notificheOrdiniNuovi: checked})}
                      disabled={!configNotifiche.emailNotifiche}
                    />
                    <Label htmlFor="notificheOrdiniNuovi">Nuovi ordini</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="notificheOrdiniCompletati"
                      name="notificheOrdiniCompletati"
                      checked={configNotifiche.notificheOrdiniCompletati}
                      onCheckedChange={(checked) => setConfigNotifiche({...configNotifiche, notificheOrdiniCompletati: checked})}
                      disabled={!configNotifiche.emailNotifiche}
                    />
                    <Label htmlFor="notificheOrdiniCompletati">Ordini completati</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="notificheScorteBasse"
                      name="notificheScorteBasse"
                      checked={configNotifiche.notificheScorteBasse}
                      onCheckedChange={(checked) => setConfigNotifiche({...configNotifiche, notificheScorteBasse: checked})}
                      disabled={!configNotifiche.emailNotifiche}
                    />
                    <Label htmlFor="notificheScorteBasse">Scorte basse</Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="mt-6">
        <Button onClick={salvaConfigurazioni}>
          Salva Configurazioni
        </Button>
      </div>
    </div>
  );
};

export default ConfigurazionePannello;
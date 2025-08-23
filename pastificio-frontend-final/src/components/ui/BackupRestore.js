// components/BackupRestore.jsx
"use client";

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, 
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter, 
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Download, Upload, Database, Calendar, Clock, RefreshCw,
  HardDrive, Cloud, FileDown, FileUp, Info, AlertTriangle, CheckCircle, Settings
} from "lucide-react";

// Formattiamo le date usando Intl invece di date-fns
function formatDate(date) {
  if (!date) return '';
  
  if (typeof date === 'string') {
    date = new Date(date);
  }
  
  return new Intl.DateTimeFormat('it-IT', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(date);
}

function formatSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default function BackupRestore() {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [activeOperation, setActiveOperation] = useState(null);
  const [fileToRestore, setFileToRestore] = useState(null);
  const fileInputRef = useRef(null);
  const { toast } = useToast();
  
  const [settings, setSettings] = useState({
    autoBackup: true,
    backupFrequency: 'daily',
    backupTime: '01:00',
    keepBackups: '15',
    cloudSync: false,
    cloudProvider: 'local',
    encryptBackups: false
  });

  useEffect(() => {
    fetchBackups();
  }, []);

  const fetchBackups = async () => {
    try {
      setLoading(true);
      // Simulazione di caricamento dati
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Dati di esempio
      const mockBackups = [
        { id: '1', name: 'backup_20240217_010000.zip', date: '2024-02-17T01:00:00Z', size: 14572800, type: 'auto', status: 'completed' },
        { id: '2', name: 'backup_20240216_010000.zip', date: '2024-02-16T01:00:00Z', size: 14336000, type: 'auto', status: 'completed' },
        { id: '3', name: 'backup_20240215_143022.zip', date: '2024-02-15T14:30:22Z', size: 15204500, type: 'manual', status: 'completed' },
        { id: '4', name: 'backup_20240215_010000.zip', date: '2024-02-15T01:00:00Z', size: 14125000, type: 'auto', status: 'completed' },
        { id: '5', name: 'backup_20240214_010000.zip', date: '2024-02-14T01:00:00Z', size: 13980000, type: 'auto', status: 'completed' },
      ];
      
      setBackups(mockBackups);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Impossibile caricare i backup. Riprova più tardi.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    try {
      setActiveOperation('backup');
      setProgress(0);
      
      // Simuliamo il progresso del backup
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 10;
        });
      }, 300);
      
      // Simuliamo il completamento dell'operazione
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Aggiungiamo il nuovo backup alla lista
      const newBackup = {
        id: Date.now().toString(),
        name: `backup_${new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14)}.zip`,
        date: new Date().toISOString(),
        size: 14800000 + Math.random() * 1000000,
        type: 'manual',
        status: 'completed'
      };
      
      setBackups([newBackup, ...backups]);
      
      toast({
        title: "Backup completato",
        description: `Il backup è stato creato con successo: ${newBackup.name}`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Si è verificato un errore durante il backup. Riprova più tardi.",
      });
    } finally {
      setActiveOperation(null);
      setProgress(0);
    }
  };

  const handleDownloadBackup = (backup) => {
    toast({
      title: "Download avviato",
      description: `Il download di ${backup.name} è stato avviato.`,
    });
    
    // In un'implementazione reale, qui si gestirebbe il download effettivo
  };

  const handleDeleteBackup = async (backupId) => {
    try {
      // Simuliamo l'eliminazione
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setBackups(backups.filter(backup => backup.id !== backupId));
      
      toast({
        title: "Backup eliminato",
        description: "Il backup è stato eliminato con successo.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Impossibile eliminare il backup. Riprova più tardi.",
      });
    }
  };

  const handleSelectFileToRestore = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFileToRestore(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleRestoreBackup = async (backupId) => {
    try {
      setActiveOperation('restore');
      setProgress(0);
      
      // Simuliamo il progresso del ripristino
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 5;
        });
      }, 200);
      
      // Simuliamo il completamento dell'operazione
      await new Promise(resolve => setTimeout(resolve, 4000));
      
      toast({
        title: "Ripristino completato",
        description: "Il database è stato ripristinato con successo.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Si è verificato un errore durante il ripristino. Riprova più tardi.",
      });
    } finally {
      setActiveOperation(null);
      setProgress(0);
      setFileToRestore(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSettingChange = (name, value) => {
    setSettings({
      ...settings,
      [name]: value
    });
  };

  const saveSettings = () => {
    toast({
      title: "Impostazioni salvate",
      description: "Le impostazioni di backup sono state aggiornate con successo.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Backup e Ripristino</h2>
        <div className="flex space-x-2">
          <Button onClick={fetchBackups} variant="outline" disabled={loading} className="flex items-center gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Aggiorna
          </Button>
        </div>
      </div>

      <Tabs defaultValue="backups" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="backups">Backup</TabsTrigger>
          <TabsTrigger value="restore">Ripristino</TabsTrigger>
          <TabsTrigger value="settings">Impostazioni</TabsTrigger>
        </TabsList>
        
        <TabsContent value="backups" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Backup dati</CardTitle>
              <CardDescription>
                Crea un nuovo backup o gestisci quelli esistenti
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activeOperation === 'backup' ? (
                <div className="space-y-4 py-4">
                  <div className="text-center space-y-4">
                    <Database className="h-12 w-12 mx-auto animate-pulse text-primary" />
                    <h3 className="text-lg font-medium">Backup in corso...</h3>
                    <Progress value={progress} className="w-full h-2" />
                    <p className="text-sm text-muted-foreground">
                      {progress < 100 
                        ? `Creazione backup in corso: ${progress}%` 
                        : 'Completamento del processo...'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    <div>
                      <h3 className="text-lg font-medium">Crea nuovo backup</h3>
                      <p className="text-sm text-muted-foreground">
                        Crea un backup manuale del database e delle impostazioni
                      </p>
                    </div>
                    <Button 
                      onClick={handleCreateBackup} 
                      className="flex items-center gap-2"
                      disabled={activeOperation !== null}
                    >
                      <Database className="h-4 w-4" />
                      Crea backup
                    </Button>
                  </div>

                  <div className="pt-4">
                    <h3 className="text-lg font-medium mb-4">Backup disponibili</h3>
                    
                    {loading ? (
                      <div className="flex justify-center py-8">
                        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                      </div>
                    ) : backups.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        Nessun backup disponibile
                      </div>
                    ) : (
                      <ScrollArea className="h-[350px] rounded-md border">
                        <div className="p-4">
                          {backups.map((backup) => (
                            <div 
                      key={backup.id} 
                              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3 
                                border-b last:border-b-0"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{backup.name}</span>
                                  {backup.type === 'auto' ? (
                                    <Badge variant="outline" className="text-xs">Auto</Badge>
                                  ) : (
                                    <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 text-xs">Manuale</Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3.5 w-3.5" />
                                    <span>{formatDate(backup.date)}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <HardDrive className="h-3.5 w-3.5" />
                                    <span>{formatSize(backup.size)}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2 self-end sm:self-center">
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="sm" className="flex gap-1">
                                      <FileDown className="h-4 w-4" />
                                      <span className="hidden sm:inline">Scarica</span>
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Download backup</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Sei sicuro di voler scaricare questo backup? La dimensione del file è {formatSize(backup.size)}.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Annulla</AlertDialogCancel>
                                      <AlertDialogAction 
                                        onClick={() => handleDownloadBackup(backup)}
                                      >
                                        Scarica
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                                
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      className="flex gap-1 text-destructive hover:text-destructive"
                                    >
                                      <AlertTriangle className="h-4 w-4" />
                                      <span className="hidden sm:inline">Elimina</span>
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Eliminazione backup</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Sei sicuro di voler eliminare questo backup? Questa azione non può essere annullata.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Annulla</AlertDialogCancel>
                                      <AlertDialogAction 
                                        onClick={() => handleDeleteBackup(backup.id)}
                                        className="bg-destructive hover:bg-destructive/90"
                                      >
                                        Elimina
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>

                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      className="flex gap-1 text-amber-600 hover:text-amber-600"
                                      disabled={activeOperation !== null}
                                    >
                                      <FileUp className="h-4 w-4" />
                                      <span className="hidden sm:inline">Ripristina</span>
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Ripristino backup</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        <div className="space-y-4 pt-2">
                                          <div className="flex items-start gap-2 text-amber-600">
                                            <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                                            <div>
                                              <p className="font-medium">Attenzione: operazione irreversibile</p>
                                              <p className="text-sm text-muted-foreground mt-1">
                                                Il ripristino sovrascriverà tutti i dati attuali. Assicurati di avere una copia di backup recente prima di procedere.
                                              </p>
                                            </div>
                                          </div>
                                          <p>
                                            Vuoi procedere con il ripristino dal backup del {formatDate(backup.date)}?
                                          </p>
                                        </div>
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Annulla</AlertDialogCancel>
                                      <AlertDialogAction 
                                        onClick={() => handleRestoreBackup(backup.id)}
                                        className="bg-amber-600 hover:bg-amber-700"
                                      >
                                        Ripristina
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-6">
              <div className="text-sm text-muted-foreground">
                {backups.length > 0 ? (
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    <span>
                      Ultimo backup: {formatDate(backups[0]?.date)} ({formatSize(backups[0]?.size)})
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    <span>Nessun backup disponibile</span>
                  </div>
                )}
              </div>
              {settings.autoBackup && (
                <Badge 
                  variant="outline" 
                  className="flex items-center gap-1 bg-green-50 text-green-700 hover:bg-green-50"
                >
                  <Clock className="h-3 w-3" />
                  <span>
                    Backup automatico {settings.backupFrequency === 'daily' ? 'giornaliero' : 
                      settings.backupFrequency === 'weekly' ? 'settimanale' : 'mensile'} alle {settings.backupTime}
                  </span>
                </Badge>
              )}
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="restore" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ripristino dati</CardTitle>
              <CardDescription>
                Ripristina un backup precedente o carica un file di backup
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activeOperation === 'restore' ? (
                <div className="space-y-4 py-4">
                  <div className="text-center space-y-4">
                    <Database className="h-12 w-12 mx-auto animate-pulse text-amber-600" />
                    <h3 className="text-lg font-medium">Ripristino in corso...</h3>
                    <Progress value={progress} className="w-full h-2" />
                    <p className="text-sm text-muted-foreground">
                      {progress < 100 
                        ? `Ripristino dati: ${progress}%` 
                        : 'Completamento del processo...'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Carica file di backup</h3>
                    <div className="flex items-center gap-4">
                      <Input
                        ref={fileInputRef}
                        type="file"
                        accept=".zip,.bak,.backup"
                        onChange={handleSelectFileToRestore}
                        className="hidden"
                      />
                      <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-4">
                        <Button 
                          onClick={triggerFileInput}
                          variant="outline"
                          className="flex items-center gap-2"
                        >
                          <Upload className="h-4 w-4" />
                          Seleziona file
                        </Button>
                        {fileToRestore ? (
                          <div className="text-sm">
                            <p className="font-medium">{fileToRestore.name}</p>
                            <p className="text-muted-foreground">
                              {formatSize(fileToRestore.size)} - 
                              Selezionato il {formatDate(new Date())}
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            Seleziona un file di backup (.zip, .bak, .backup)
                          </p>
                        )}
                      </div>
                      {fileToRestore && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              className="flex items-center gap-2"
                              variant="default"
                            >
                              <FileUp className="h-4 w-4" />
                              Ripristina
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Conferma ripristino</AlertDialogTitle>
                              <AlertDialogDescription>
                                <div className="space-y-4 pt-2">
                                  <div className="flex items-start gap-2 text-amber-600">
                                    <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                                    <div>
                                      <p className="font-medium">Attenzione: operazione irreversibile</p>
                                      <p className="text-sm text-muted-foreground mt-1">
                                        Il ripristino sovrascriverà tutti i dati attuali. Assicurati di avere una copia di backup recente prima di procedere.
                                      </p>
                                    </div>
                                  </div>
                                  <p>
                                    Vuoi procedere con il ripristino dal file {fileToRestore?.name}?
                                  </p>
                                </div>
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annulla</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleRestoreBackup('file')}
                                className="bg-amber-600 hover:bg-amber-700"
                              >
                                Ripristina
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
                  
                  <div className="pt-4">
                    <h3 className="text-lg font-medium mb-4">Ripristina da backup esistente</h3>
                    {loading ? (
                      <div className="flex justify-center py-8">
                        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                      </div>
                    ) : backups.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        Nessun backup disponibile
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {backups.slice(0, 6).map((backup) => (
                          <Card key={backup.id} className="overflow-hidden">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-base">{backup.name}</CardTitle>
                              <CardDescription>
                                {formatDate(backup.date)}
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="pb-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm">{formatSize(backup.size)}</span>
                                <Badge variant={backup.type === 'auto' ? 'outline' : 'secondary'}>
                                  {backup.type === 'auto' ? 'Auto' : 'Manuale'}
                                </Badge>
                              </div>
                            </CardContent>
                            <CardFooter className="pt-2">
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    className="w-full flex items-center gap-2"
                                    variant="outline"
                                  >
                                    <FileUp className="h-4 w-4" />
                                    Ripristina
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Conferma ripristino</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      <div className="space-y-4 pt-2">
                                        <div className="flex items-start gap-2 text-amber-600">
                                          <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                                          <div>
                                            <p className="font-medium">Attenzione: operazione irreversibile</p>
                                            <p className="text-sm text-muted-foreground mt-1">
                                              Il ripristino sovrascriverà tutti i dati attuali. Assicurati di avere una copia di backup recente prima di procedere.
                                            </p>
                                          </div>
                                        </div>
                                        <p>
                                          Vuoi procedere con il ripristino dal backup del {formatDate(backup.date)}?
                                        </p>
                                      </div>
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Annulla</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => handleRestoreBackup(backup.id)}
                                      className="bg-amber-600 hover:bg-amber-700"
                                    >
                                      Ripristina
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </CardFooter>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="border-t pt-6">
              <div className="w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    <span>
                      Il ripristino richiederà il riavvio dell'applicazione
                    </span>
                  </div>
                </div>
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={fetchBackups}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Aggiorna lista
                </Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Impostazioni backup</CardTitle>
              <CardDescription>
                Configura le opzioni per il backup automatico e il ripristino
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="autoBackup" className="text-base font-medium">Backup automatico</Label>
                    <Switch
                      id="autoBackup"
                      checked={settings.autoBackup}
                      onCheckedChange={(checked) => handleSettingChange('autoBackup', checked)}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Attiva il backup automatico del database a intervalli regolari
                  </p>
                </div>
                
                {settings.autoBackup && (
                  <div className="space-y-4 pl-6 border-l-2 border-muted-foreground/20">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="backupFrequency">Frequenza</Label>
                        <Select
                          value={settings.backupFrequency}
                          onValueChange={(value) => handleSettingChange('backupFrequency', value)}
                        >
                          <SelectTrigger id="backupFrequency">
                            <SelectValue placeholder="Seleziona frequenza" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Giornaliero</SelectItem>
                            <SelectItem value="weekly">Settimanale</SelectItem>
                            <SelectItem value="monthly">Mensile</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="backupTime">Orario</Label>
                        <Input
                          id="backupTime"
                          type="time"
                          value={settings.backupTime}
                          onChange={(e) => handleSettingChange('backupTime', e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="keepBackups">Mantieni backup</Label>
                        <Select
                          value={settings.keepBackups}
                          onValueChange={(value) => handleSettingChange('keepBackups', value)}
                        >
                          <SelectTrigger id="keepBackups">
                            <SelectValue placeholder="Seleziona durata" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="7">Ultimi 7 backup</SelectItem>
                            <SelectItem value="15">Ultimi 15 backup</SelectItem>
                            <SelectItem value="30">Ultimi 30 backup</SelectItem>
                            <SelectItem value="90">Ultimi 90 backup</SelectItem>
                            <SelectItem value="-1">Tutti i backup</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex flex-col gap-1.5 pt-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="cloudSync" className="text-base font-medium">Sincronizzazione cloud</Label>
                    <Switch
                      id="cloudSync"
                      checked={settings.cloudSync}
                      onCheckedChange={(checked) => handleSettingChange('cloudSync', checked)}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Carica i backup su un servizio cloud per maggiore sicurezza
                  </p>
                </div>
                
                {settings.cloudSync && (
                  <div className="space-y-4 pl-6 border-l-2 border-muted-foreground/20">
                    <div className="space-y-2">
                      <Label htmlFor="cloudProvider">Provider cloud</Label>
                      <Select
                        value={settings.cloudProvider}
                        onValueChange={(value) => handleSettingChange('cloudProvider', value)}
                      >
                        <SelectTrigger id="cloudProvider">
                          <SelectValue placeholder="Seleziona provider" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="local">Storage locale</SelectItem>
                          <SelectItem value="dropbox">Dropbox</SelectItem>
                          <SelectItem value="gdrive">Google Drive</SelectItem>
                          <SelectItem value="s3">Amazon S3</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {settings.cloudProvider !== 'local' && (
                      <div className="space-y-2">
                        <Label htmlFor="cloudSettings">Configurazione {
                          settings.cloudProvider === 'dropbox' ? 'Dropbox' :
                          settings.cloudProvider === 'gdrive' ? 'Google Drive' :
                          settings.cloudProvider === 's3' ? 'Amazon S3' : ''
                        }</Label>
                        <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                          <Settings className="h-4 w-4" />
                          Configura connessione
                        </Button>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="flex flex-col gap-1.5 pt-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="encryptBackups" className="text-base font-medium">Crittografia backup</Label>
                    <Switch
                      id="encryptBackups"
                      checked={settings.encryptBackups}
                      onCheckedChange={(checked) => handleSettingChange('encryptBackups', checked)}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Proteggi i tuoi backup con crittografia AES-256
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-6 flex justify-between">
              <Button variant="outline">Ripristina predefiniti</Button>
              <Button onClick={saveSettings}>Salva impostazioni</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
// components/GestioneUtenti.jsx
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Dialog, DialogContent, DialogDescription, 
  DialogFooter, DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { Eye, EyeOff, UserPlus, Edit, Trash2, RefreshCw, Shield, ShieldAlert } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function GestioneUtenti() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    nome: '',
    cognome: '',
    email: '',
    ruolo: 'operatore',
    attivo: true
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // Simuliamo il caricamento dei dati - da sostituire con chiamata API reale
      const response = await new Promise(resolve => 
        setTimeout(() => resolve({
          data: [
            { id: '1', username: 'admin', nome: 'Admin', cognome: 'Principale', email: 'admin@pastificio.it', ruolo: 'admin', attivo: true, ultimoAccesso: '2024-02-17T10:30:00Z' },
            { id: '2', username: 'operatore1', nome: 'Mario', cognome: 'Rossi', email: 'mario@pastificio.it', ruolo: 'operatore', attivo: true, ultimoAccesso: '2024-02-16T14:20:00Z' },
            { id: '3', username: 'operatore2', nome: 'Giulia', cognome: 'Bianchi', email: 'giulia@pastificio.it', ruolo: 'operatore', attivo: false, ultimoAccesso: '2024-01-25T09:15:00Z' },
          ]
        }), 800)
      );
      setUsers(response.data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Impossibile caricare gli utenti. Riprova più tardi.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleRoleChange = (value) => {
    setFormData({
      ...formData,
      ruolo: value
    });
  };

  const handleStatusChange = (checked) => {
    setFormData({
      ...formData,
      attivo: checked
    });
  };

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      nome: '',
      cognome: '',
      email: '',
      ruolo: 'operatore',
      attivo: true
    });
    setCurrentUser(null);
    setShowPassword(false);
  };

  const handleOpenDialog = (user = null) => {
    if (user) {
      setFormData({
        ...user,
        password: '', // Non mostriamo la password esistente
      });
      setCurrentUser(user);
    } else {
      resetForm();
    }
    setOpenDialog(true);
  };

  const handleSubmit = async () => {
    try {
      // Validazione base
      if (!formData.username || !formData.nome || !formData.cognome || !formData.email) {
        toast({
          variant: "destructive",
          title: "Errore di validazione",
          description: "Tutti i campi sono obbligatori.",
        });
        return;
      }
      
      if (!currentUser && !formData.password) {
        toast({
          variant: "destructive",
          title: "Errore di validazione",
          description: "La password è obbligatoria per i nuovi utenti.",
        });
        return;
      }
      
      // Simuliamo il salvataggio - da sostituire con chiamata API reale
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (currentUser) {
        // Aggiornamento utente esistente
        setUsers(users.map(u => u.id === currentUser.id ? { ...formData, id: currentUser.id } : u));
        toast({
          title: "Utente aggiornato",
          description: `Le modifiche a ${formData.nome} ${formData.cognome} sono state salvate.`,
        });
      } else {
        // Creazione nuovo utente
        const newUser = {
          ...formData,
          id: Date.now().toString(),
          ultimoAccesso: null
        };
        setUsers([...users, newUser]);
        toast({
          title: "Utente creato",
          description: `${formData.nome} ${formData.cognome} è stato aggiunto con successo.`,
        });
      }
      
      setOpenDialog(false);
      resetForm();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Si è verificato un errore durante il salvataggio.",
      });
    }
  };

  const handleDeleteUser = async (userId) => {
    if (confirm("Sei sicuro di voler eliminare questo utente?")) {
      try {
        // Simuliamo l'eliminazione - da sostituire con chiamata API reale
        await new Promise(resolve => setTimeout(resolve, 300));
        setUsers(users.filter(user => user.id !== userId));
        toast({
          title: "Utente eliminato",
          description: "L'utente è stato rimosso con successo.",
        });
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Errore",
          description: "Impossibile eliminare l'utente. Riprova più tardi.",
        });
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Mai';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('it-IT', {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(date);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Gestione Utenti</h2>
        <div className="flex space-x-2">
          <Button onClick={() => handleOpenDialog()} className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Nuovo Utente
          </Button>
          <Button variant="outline" onClick={fetchUsers} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Aggiorna
          </Button>
        </div>
      </div>

      <Tabs defaultValue="tutti" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tutti">Tutti gli utenti</TabsTrigger>
          <TabsTrigger value="attivi">Utenti attivi</TabsTrigger>
          <TabsTrigger value="inattivi">Utenti inattivi</TabsTrigger>
        </TabsList>
        <TabsContent value="tutti">
          <UserTable 
            users={users} 
            loading={loading} 
            onEdit={handleOpenDialog}
            onDelete={handleDeleteUser}
            formatDate={formatDate}
          />
        </TabsContent>
        <TabsContent value="attivi">
          <UserTable 
            users={users.filter(user => user.attivo)} 
            loading={loading} 
            onEdit={handleOpenDialog}
            onDelete={handleDeleteUser}
            formatDate={formatDate}
          />
        </TabsContent>
        <TabsContent value="inattivi">
          <UserTable 
            users={users.filter(user => !user.attivo)} 
            loading={loading} 
            onEdit={handleOpenDialog}
            onDelete={handleDeleteUser}
            formatDate={formatDate}
          />
        </TabsContent>
      </Tabs>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{currentUser ? 'Modifica Utente' : 'Nuovo Utente'}</DialogTitle>
            <DialogDescription>
              {currentUser 
                ? 'Modifica i dettagli dell\'utente esistente' 
                : 'Inserisci i dettagli per creare un nuovo utente'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome</Label>
                <Input
                  id="nome"
                  name="nome"
                  value={formData.nome}
                  onChange={handleInputChange}
                  placeholder="Nome"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cognome">Cognome</Label>
                <Input
                  id="cognome"
                  name="cognome"
                  value={formData.cognome}
                  onChange={handleInputChange}
                  placeholder="Cognome"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password {currentUser && "(lascia vuoto per non modificare)"}</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ruolo">Ruolo</Label>
                <Select
                  value={formData.ruolo}
                  onValueChange={handleRoleChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona ruolo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Amministratore</SelectItem>
                    <SelectItem value="operatore">Operatore</SelectItem>
                    <SelectItem value="visualizzatore">Visualizzatore</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="attivo" className="block mb-2">Stato</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="attivo"
                    checked={formData.attivo}
                    onCheckedChange={handleStatusChange}
                  />
                  <Label htmlFor="attivo" className="cursor-pointer">
                    {formData.attivo ? 'Attivo' : 'Inattivo'}
                  </Label>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(false)}>
              Annulla
            </Button>
            <Button onClick={handleSubmit}>
              {currentUser ? 'Aggiorna' : 'Crea'} utente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function UserTable({ users, loading, onEdit, onDelete, formatDate }) {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="flex flex-col items-center justify-center py-10">
            <RefreshCw className="h-10 w-10 animate-spin text-muted-foreground" />
            <p className="mt-4 text-lg text-muted-foreground">Caricamento utenti...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (users.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground py-10">Nessun utente trovato</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Utente</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Ruolo</TableHead>
              <TableHead>Stato</TableHead>
              <TableHead>Ultimo accesso</TableHead>
              <TableHead className="text-right">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  <div>
                    <div>{user.nome} {user.cognome}</div>
                    <div className="text-sm text-muted-foreground">{user.username}</div>
                  </div>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  {user.ruolo === 'admin' ? (
                    <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                      <ShieldAlert className="h-3 w-3" />
                      <span>Admin</span>
                    </Badge>
                  ) : user.ruolo === 'operatore' ? (
                    <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                      <Shield className="h-3 w-3" />
                      <span>Operatore</span>
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="w-fit">
                      Visualizzatore
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {user.attivo ? (
                    <Badge variant="success" className="bg-green-100 text-green-800 hover:bg-green-100">Attivo</Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-gray-100 text-gray-800 hover:bg-gray-100">Inattivo</Badge>
                  )}
                </TableCell>
                <TableCell>{formatDate(user.ultimoAccesso)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(user)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(user.id)}
                      disabled={user.ruolo === 'admin' && users.filter(u => u.ruolo === 'admin').length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter className="py-4 border-t flex justify-between">
        <div className="text-sm text-muted-foreground">
          Totale: {users.length} utenti
        </div>
      </CardFooter>
    </Card>
  );
}
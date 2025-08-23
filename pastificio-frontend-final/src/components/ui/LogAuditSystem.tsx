import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, Download, Filter, Search } from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  categoria: string;
  dettagli: string;
  ip: string;
  livello: 'info' | 'warning' | 'error';
}

interface FiltriLog {
  startDate: string;
  endDate: string;
  user: string;
  categoria: string;
  livello: string;
  searchText: string;
}

const LogAuditSystem: React.FC = () => {
  // Stati per i filtri e i log
  const [filtri, setFiltri] = useState<FiltriLog>({
    startDate: '',
    endDate: '',
    user: '',
    categoria: '',
    livello: '',
    searchText: ''
  });

  // Simulazione di dati di log
  const [logs] = useState<LogEntry[]>([
    {
      id: '1',
      timestamp: '2024-03-01T10:00:00',
      user: 'admin',
      action: 'Creazione ordine',
      categoria: 'ordini',
      dettagli: 'Nuovo ordine #123 creato',
      ip: '192.168.1.1',
      livello: 'info'
    },
    // Altri log di esempio...
  ]);

  // Funzione per registrare nuovi log
  const logAction = useCallback((action: Partial<LogEntry>) => {
    const newLog: LogEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      user: 'current_user',
      action: '',
      categoria: '',
      dettagli: '',
      ip: '127.0.0.1',
      livello: 'info',
      ...action
    };
    // Qui andrebbe implementata la logica per salvare il log nel backend
    console.log('Nuovo log:', newLog);
  }, []);

  // Filtraggio dei log
  const logsFiltrati = useMemo(() => {
    return logs.filter(log => {
      const matchesDate = (!filtri.startDate || log.timestamp >= filtri.startDate) &&
                         (!filtri.endDate || log.timestamp <= filtri.endDate);
      const matchesUser = !filtri.user || log.user.toLowerCase().includes(filtri.user.toLowerCase());
      const matchesCategoria = !filtri.categoria || log.categoria === filtri.categoria;
      const matchesLivello = !filtri.livello || log.livello === filtri.livello;
      const matchesSearch = !filtri.searchText || 
                          log.dettagli.toLowerCase().includes(filtri.searchText.toLowerCase()) ||
                          log.action.toLowerCase().includes(filtri.searchText.toLowerCase());

      return matchesDate && matchesUser && matchesCategoria && matchesLivello && matchesSearch;
    });
  }, [logs, filtri]);

  // Funzione per esportare i log
  const esportaLog = useCallback(() => {
    const csv = [
      ['ID', 'Timestamp', 'Utente', 'Azione', 'Categoria', 'Dettagli', 'IP', 'Livello'],
      ...logsFiltrati.map(log => [
        log.id,
        log.timestamp,
        log.user,
        log.action,
        log.categoria,
        log.dettagli,
        log.ip,
        log.livello
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `log_audit_${new Date().toISOString()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, [logsFiltrati]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Sistema di Log e Audit</span>
          <Button onClick={esportaLog} className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Esporta Log
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Filtri */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <Input
              type="date"
              placeholder="Data inizio"
              value={filtri.startDate}
              onChange={e => setFiltri(prev => ({ ...prev, startDate: e.target.value }))}
            />
          </div>
          <div>
            <Input
              type="date"
              placeholder="Data fine"
              value={filtri.endDate}
              onChange={e => setFiltri(prev => ({ ...prev, endDate: e.target.value }))}
            />
          </div>
          <div>
            <Input
              placeholder="Cerca..."
              value={filtri.searchText}
              onChange={e => setFiltri(prev => ({ ...prev, searchText: e.target.value }))}
              className="flex items-center gap-2"
            />
          </div>
          <Select
            value={filtri.categoria}
            onValueChange={value => setFiltri(prev => ({ ...prev, categoria: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Tutte le categorie</SelectItem>
              <SelectItem value="ordini">Ordini</SelectItem>
              <SelectItem value="prodotti">Prodotti</SelectItem>
              <SelectItem value="utenti">Utenti</SelectItem>
              <SelectItem value="configurazione">Configurazione</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filtri.livello}
            onValueChange={value => setFiltri(prev => ({ ...prev, livello: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Livello" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Tutti i livelli</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabella dei log */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Utente</TableHead>
                <TableHead>Azione</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Dettagli</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>Livello</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logsFiltrati.map(log => (
                <TableRow key={log.id}>
                  <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                  <TableCell>{log.user}</TableCell>
                  <TableCell>{log.action}</TableCell>
                  <TableCell>{log.categoria}</TableCell>
                  <TableCell>{log.dettagli}</TableCell>
                  <TableCell>{log.ip}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-sm ${
                      log.livello === 'error' ? 'bg-red-100 text-red-800' :
                      log.livello === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {log.livello}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default LogAuditSystem;
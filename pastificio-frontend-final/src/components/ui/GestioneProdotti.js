'use client';

import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { PlusCircle, Pencil, Trash2 } from 'lucide-react';

export default function GestioneProdotti({ open, onClose, prodotti, onUpdate }) {
  const [categorie, setCategorie] = useState(() => 
    Array.from(new Set(prodotti.map(p => p.categoria)))
  );
  const [editing, setEditing] = useState(null);
  const [nuovaCategoria, setNuovaCategoria] = useState('');
  const [nuovoProdotto, setNuovoProdotto] = useState({
    nome: '',
    prezzo: '',
    categoria: '',
    unita: 'Kg'
  });

  // Le funzioni handler restano uguali
  const handleAggiungiCategoria = () => {
    if (nuovaCategoria && !categorie.includes(nuovaCategoria)) {
      setCategorie([...categorie, nuovaCategoria]);
      setNuovaCategoria('');
    }
  };

  const handleAggiungiProdotto = () => {
    if (nuovoProdotto.nome && nuovoProdotto.prezzo && nuovoProdotto.categoria) {
      onUpdate([...prodotti, {
        ...nuovoProdotto,
        prezzo: parseFloat(nuovoProdotto.prezzo),
        id: Date.now().toString()
      }]);
      setNuovoProdotto({
        nome: '',
        prezzo: '',
        categoria: '',
        unita: 'Kg'
      });
    }
  };

  // ... resto delle funzioni handler

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogHeader>
        <DialogTitle>Gestione Prodotti e Categorie</DialogTitle>
      </DialogHeader>
      <DialogContent className="max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sezione Categorie */}
          <div className="md:col-span-1">
            <h3 className="text-lg font-semibold mb-4">Categorie</h3>
            <div className="flex gap-2 mb-4">
              <Input
                value={nuovaCategoria}
                onChange={(e) => setNuovaCategoria(e.target.value)}
                placeholder="Nuova Categoria"
              />
              <Button onClick={handleAggiungiCategoria} disabled={!nuovaCategoria}>
                <PlusCircle className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2">
              {categorie.map((categoria) => (
                <div key={categoria} className="p-2 bg-secondary rounded">
                  {categoria}
                </div>
              ))}
            </div>
          </div>

          {/* Sezione Prodotti */}
          <div className="md:col-span-3">
            <h3 className="text-lg font-semibold mb-4">Prodotti</h3>
            
            {/* Form nuovo prodotto */}
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="nome">Nome Prodotto</Label>
                    <Input
                      id="nome"
                      value={nuovoProdotto.nome}
                      onChange={(e) => setNuovoProdotto({
                        ...nuovoProdotto,
                        nome: e.target.value
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="prezzo">Prezzo</Label>
                    <Input
                      id="prezzo"
                      type="number"
                      value={nuovoProdotto.prezzo}
                      onChange={(e) => setNuovoProdotto({
                        ...nuovoProdotto,
                        prezzo: e.target.value
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="categoria">Categoria</Label>
                    <Select
                      value={nuovoProdotto.categoria}
                      onValueChange={(value) => setNuovoProdotto({
                        ...nuovoProdotto,
                        categoria: value
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona" />
                      </SelectTrigger>
                      <SelectContent>
                        {categorie.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button 
                      onClick={handleAggiungiProdotto}
                      disabled={!nuovoProdotto.nome || !nuovoProdotto.prezzo || !nuovoProdotto.categoria}
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Aggiungi
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabella prodotti */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Prezzo</TableHead>
                    <TableHead>Unità</TableHead>
                    <TableHead className="text-right">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prodotti
                    .sort((a, b) => a.categoria.localeCompare(b.categoria))
                    .map((prodotto) => (
                      <TableRow key={prodotto.id}>
                        <TableCell>{prodotto.nome}</TableCell>
                        <TableCell>{prodotto.categoria}</TableCell>
                        <TableCell className="text-right">
                          €{prodotto.prezzo.toFixed(2)}
                        </TableCell>
                        <TableCell>{prodotto.unita}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleModificaProdotto(prodotto)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEliminaProdotto(prodotto.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </DialogContent>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Chiudi
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
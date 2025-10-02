import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, Printer, Save, Plus, Trash, Edit } from 'lucide-react';

interface Template {
  id: string;
  nome: string;
  tipo: 'ordine' | 'resoconto' | 'etichetta' | 'fattura';
  contenuto: string;
  orientamento: 'portrait' | 'landscape';
  dimensioneCarta: 'A4' | 'A5' | 'etichetta';
  attivo: boolean;
  variabili: string[];
  intestazione: boolean;
  pieDiPagina: boolean;
}

const SistemaStampe: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([
    {
      id: '1',
      nome: 'Ordine Standard',
      tipo: 'ordine',
      contenuto: `
        <h1>{{nomePastificio}}</h1>
        <h2>Ordine #{{numeroOrdine}}</h2>
        <p>Cliente: {{nomeCliente}}</p>
        <p>Data: {{dataOrdine}}</p>
        <table>
          <tr><th>Prodotto</th><th>Quantità</th><th>Prezzo</th></tr>
          {{#each prodotti}}
          <tr><td>{{nome}}</td><td>{{quantita}}</td><td>{{prezzo}}</td></tr>
          {{/each}}
        </table>
      `,
      orientamento: 'portrait',
      dimensioneCarta: 'A4',
      attivo: true,
      variabili: ['nomePastificio', 'numeroOrdine', 'nomeCliente', 'dataOrdine', 'prodotti'],
      intestazione: true,
      pieDiPagina: true
    }
  ]);

  const [templateCorrente, setTemplateCorrente] = useState<Template | null>(null);
  const [mostraAnteprima, setMostraAnteprima] = useState(false);
  const [datiEsempio] = useState({
    nomePastificio: "Il Pastificio",
    numeroOrdine: "123",
    nomeCliente: "Mario Rossi",
    dataOrdine: "2024-03-01",
    prodotti: [
      { nome: "Pasta al ragù", quantita: 2, prezzo: "12.00€" },
      { nome: "Lasagne", quantita: 1, prezzo: "15.00€" }
    ]
  });

  const creaTemplate = useCallback(() => {
    const nuovoTemplate: Template = {
      id: Date.now().toString(),
      nome: "Nuovo Template",
      tipo: "ordine",
      contenuto: "",
      orientamento: "portrait",
      dimensioneCarta: "A4",
      attivo: true,
      variabili: [],
      intestazione: true,
      pieDiPagina: true
    };
    setTemplates(prev => [...prev, nuovoTemplate]);
    setTemplateCorrente(nuovoTemplate);
  }, []);

  const salvaTemplate = useCallback(() => {
    if (!templateCorrente) return;
    setTemplates(prev => prev.map(t => 
      t.id === templateCorrente.id ? templateCorrente : t
    ));
  }, [templateCorrente]);

  const eliminaTemplate = useCallback((id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
    if (templateCorrente?.id === id) {
      setTemplateCorrente(null);
    }
  }, [templateCorrente]);

  const generaStampa = useCallback((template: Template, dati: any) => {
    // Qui andrebbe implementata la logica per generare il PDF
    // Per ora facciamo una semplice sostituzione delle variabili
    let contenuto = template.contenuto;
    Object.entries(dati).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      contenuto = contenuto.replace(regex, String(value));
    });

    // Gestione dei cicli {{#each}}
    const eachRegex = /{{#each (\w+)}}([\s\S]*?){{\/each}}/g;
    contenuto = contenuto.replace(eachRegex, (match, key, template) => {
      if (!dati[key] || !Array.isArray(dati[key])) return '';
      return dati[key].map((item: any) => {
        let itemTemplate = template;
        Object.entries(item).forEach(([k, v]) => {
          const regex = new RegExp(`{{${k}}}`, 'g');
          itemTemplate = itemTemplate.replace(regex, String(v));
        });
        return itemTemplate;
      }).join('');
    });

    return contenuto;
  }, []);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Sistema di Stampe</span>
          <Button onClick={creaTemplate} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nuovo Template
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="templates">
          <TabsList>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="anteprima">Anteprima</TabsTrigger>
          </TabsList>

          <TabsContent value="templates">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Dimensione</TableHead>
                    <TableHead>Attivo</TableHead>
                    <TableHead>Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map(template => (
                    <TableRow key={template.id}>
                      <TableCell>{template.nome}</TableCell>
                      <TableCell>{template.tipo}</TableCell>
                      <TableCell>{template.dimensioneCarta}</TableCell>
                      <TableCell>
                        <Switch 
                          checked={template.attivo}
                          onCheckedChange={(checked) => {
                            setTemplates(prev => prev.map(t => 
                              t.id === template.id ? {...t, attivo: checked} : t
                            ));
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setTemplateCorrente(template)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setMostraAnteprima(true)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => eliminaTemplate(template.id)}
                          >
                            <Trash className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="editor">
            {templateCorrente ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nome">Nome Template</Label>
                    <Input
                      id="nome"
                      value={templateCorrente.nome}
                      onChange={e => setTemplateCorrente(prev => 
                        prev ? {...prev, nome: e.target.value} : null
                      )}
                    />
                  </div>
                  <div>
                    <Label htmlFor="tipo">Tipo</Label>
                    <Select
                      value={templateCorrente.tipo}
                      onValueChange={value => setTemplateCorrente(prev =>
                        prev ? {...prev, tipo: value as Template['tipo']} : null
                      )}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ordine">Ordine</SelectItem>
                        <SelectItem value="resoconto">Resoconto</SelectItem>
                        <SelectItem value="etichetta">Etichetta</SelectItem>
                        <SelectItem value="fattura">Fattura</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dimensioneCarta">Dimensione Carta</Label>
                    <Select
                      value={templateCorrente.dimensioneCarta}
                      onValueChange={value => setTemplateCorrente(prev =>
                        prev ? {...prev, dimensioneCarta: value as Template['dimensioneCarta']} : null
                      )}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A4">A4</SelectItem>
                        <SelectItem value="A5">A5</SelectItem>
                        <SelectItem value="etichetta">Etichetta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="orientamento">Orientamento</Label>
                    <Select
                      value={templateCorrente.orientamento}
                      onValueChange={value => setTemplateCorrente(prev =>
                        prev ? {...prev, orientamento: value as Template['orientamento']} : null
                      )}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="portrait">Verticale</SelectItem>
                        <SelectItem value="landscape">Orizzontale</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="contenuto">Contenuto Template</Label>
                  <Textarea
                    id="contenuto"
                    value={templateCorrente.contenuto}
                    onChange={e => setTemplateCorrente(prev =>
                      prev ? {...prev, contenuto: e.target.value} : null
                    )}
                    className="min-h-[300px] font-mono"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setTemplateCorrente(null)}>
                    Annulla
                  </Button>
                  <Button onClick={salvaTemplate}>
                    <Save className="w-4 h-4 mr-2" />
                    Salva Template
                  </Button>
                </div>
              </div>
            ) : (
              <Alert>
                <AlertDescription>
                  Seleziona un template dalla lista o crea un nuovo template per iniziare a modificare.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="anteprima">
            {templateCorrente ? (
              <div className="space-y-4">
                <div className="border rounded-lg p-4 bg-white">
                  <div 
                    dangerouslySetInnerHTML={{ 
                      __html: generaStampa(templateCorrente, datiEsempio) 
                    }}
                    className="prose max-w-none"
                  />
                </div>
                <div className="flex justify-end">
                  <Button className="flex items-center gap-2">
                    <Printer className="w-4 h-4" />
                    Stampa
                  </Button>
                </div>
              </div>
            ) : (
              <Alert>
                <AlertDescription>
                  Seleziona un template per visualizzare l'anteprima.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default SistemaStampe;
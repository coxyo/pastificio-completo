# 🚀 Pastificio MCP Server

Server MCP (Model Context Protocol) per accedere al database del Pastificio Nonna Claudia direttamente da Claude.

## 📦 Installazione

```bash
# 1. Clona o copia questa directory
cd C:\Users\Maurizio Mameli\pastificio-completo\mcp-server

# 2. Installa dipendenze
npm install

# 3. Configura variabili ambiente
cp .env.example .env
# Modifica .env con i tuoi valori reali
```

## ⚙️ Configurazione Claude Desktop

### Windows
Apri il file di configurazione:
```
%APPDATA%\Claude\claude_desktop_config.json
```

Aggiungi questa configurazione:
```json
{
  "mcpServers": {
    "pastificio": {
      "command": "node",
      "args": ["C:\\Users\\Maurizio Mameli\\pastificio-completo\\mcp-server\\index.js"],
      "env": {
        "MONGODB_URI": "mongodb+srv://...",
        "JWT_SECRET": "..."
      }
    }
  }
}
```

### Mac
File di configurazione:
```
~/Library/Application Support/Claude/claude_desktop_config.json
```

Configurazione:
```json
{
  "mcpServers": {
    "pastificio": {
      "command": "node",
      "args": ["/Users/maurizio/pastificio-completo/mcp-server/index.js"],
      "env": {
        "MONGODB_URI": "mongodb+srv://...",
        "JWT_SECRET": "..."
      }
    }
  }
}
```

## 🔧 Test Locale

```bash
# Avvia il server manualmente
npm start

# Se vedi questo, funziona:
# ✅ MongoDB connesso
# ✅ MCP Server Pastificio avviato
```

## 🎯 Tools Disponibili

### 1. **query_ordini**
Cerca ordini con filtri opzionali.

**Esempi Claude:**
```
"Mostrami gli ordini di oggi"
"Cerca ordini di Maria Rossi questa settimana"
"Tutti gli ordini in_attesa"
```

### 2. **statistiche_giornaliere**
Statistiche del giorno corrente.

**Esempi Claude:**
```
"Quanti ordini ho oggi?"
"Qual è il fatturato di oggi?"
"Statistiche giornaliere"
```

### 3. **statistiche_periodo**
Statistiche personalizzate per periodo.

**Esempi Claude:**
```
"Statistiche dal 1 gennaio al 15 gennaio"
"Fatturato di dicembre 2024"
```

### 4. **dettaglio_ordine**
Visualizza dettagli completi ordine.

**Esempi Claude:**
```
"Mostrami dettagli ordine 507f1f77bcf86cd799439011"
"Dettaglio ordine [ID]"
```

### 5. **cerca_cliente**
Cerca clienti per nome/telefono/codice.

**Esempi Claude:**
```
"Cerca cliente Maria"
"Chi è il cliente con telefono 3898879833"
"Cerca codice CL250045"
```

### 6. **storico_cliente**
Tutti gli ordini di un cliente.

**Esempi Claude:**
```
"Storico ordini di [ID cliente]"
"Mostra tutti gli ordini di questo cliente"
```

### 7. **prodotti_disponibili**
Lista prodotti con prezzi.

**Esempi Claude:**
```
"Quali prodotti abbiamo?"
"Lista prodotti categoria ravioli"
"Prodotti non disponibili"
```

### 8. **scorte_magazzino**
Alert prodotti sotto scorta.

**Esempi Claude:**
```
"Quali prodotti sono sotto scorta?"
"Alert magazzino"
"Cosa devo riordinare?"
```

### 9. **top_clienti**
Classifica migliori clienti.

**Esempi Claude:**
```
"Top 10 clienti per fatturato"
"Clienti più fedeli"
```

### 10. **top_prodotti**
Prodotti più venduti.

**Esempi Claude:**
```
"Prodotti più venduti questo mese"
"Top prodotti dell'anno"
```

## 🐛 Troubleshooting

### Server non si connette
```bash
# Verifica variabili ambiente
cat .env

# Testa connessione MongoDB manualmente
node -e "require('mongoose').connect(process.env.MONGODB_URI).then(() => console.log('OK'))"
```

### Claude non vede il server
1. Riavvia Claude Desktop completamente
2. Verifica path assoluto in config JSON
3. Controlla log: `%APPDATA%\Claude\logs`

### Errori MongoDB
```
❌ Database non connesso
```
Soluzione: Verifica `MONGODB_URI` in `.env` o `claude_desktop_config.json`

## 📝 Log e Debug

I log del server vanno su `stderr`:
```bash
# Su Windows, vedi log in:
%APPDATA%\Claude\logs\mcp-server-pastificio.log
```

## 🔐 Sicurezza

⚠️ **IMPORTANTE:**
- Il server ha accesso COMPLETO al database
- Non condividere `.env` o credenziali MongoDB
- Usa utente MongoDB con permessi limitati se possibile

## 📞 Supporto

Per problemi o domande:
- Controlla i log in `%APPDATA%\Claude\logs`
- Verifica connessione MongoDB Atlas
- Testa tool manualmente: `npm start`

---

**Versione:** 1.0.0  
**Ultimo aggiornamento:** 15 Gennaio 2025

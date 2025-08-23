// services/clientiService.js
class ClientiService {
  constructor() {
    this.clientiCache = [];
    this.lastFetch = null;
  }

  async getClienti(forceRefresh = false) {
    // Cache per 5 minuti
    if (!forceRefresh && this.lastFetch && Date.now() - this.lastFetch < 5 * 60 * 1000) {
      return this.clientiCache;
    }

    try {
      // Prova prima il backend
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/clienti`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        this.clientiCache = data.data || [];
        this.lastFetch = Date.now();
        
        // Salva anche in localStorage per offline
        localStorage.setItem('clienti', JSON.stringify(this.clientiCache));
        
        return this.clientiCache;
      }
    } catch (error) {
      console.error('Errore caricamento clienti da API:', error);
    }

    // Fallback: localStorage
    const clientiSalvati = localStorage.getItem('clienti');
    if (clientiSalvati) {
      this.clientiCache = JSON.parse(clientiSalvati);
      return this.clientiCache;
    }

    return [];
  }

  async searchClienti(query) {
    const clienti = await this.getClienti();
    const queryLower = query.toLowerCase();
    
    return clienti.filter(cliente => 
      cliente.nome?.toLowerCase().includes(queryLower) ||
      cliente.cognome?.toLowerCase().includes(queryLower) ||
      cliente.nomeCompleto?.toLowerCase().includes(queryLower) ||
      cliente.codiceCliente?.toLowerCase().includes(queryLower) ||
      cliente.telefono?.includes(query)
    );
  }

  async saveCliente(cliente) {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/clienti`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(cliente)
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Aggiorna cache
        this.clientiCache.push(data.data);
        localStorage.setItem('clienti', JSON.stringify(this.clientiCache));
        return data.data;
      }
    } catch (error) {
      console.error('Errore salvataggio cliente:', error);
    }

    // Fallback: salva solo in locale
    const nuovoCliente = {
      ...cliente,
      _id: Date.now().toString(),
      codiceCliente: cliente.codiceCliente || this.generaCodiceCliente()
    };
    
    this.clientiCache.push(nuovoCliente);
    localStorage.setItem('clienti', JSON.stringify(this.clientiCache));
    
    return nuovoCliente;
  }

  generaCodiceCliente() {
    const anno = new Date().getFullYear().toString().substr(-2);
    const numero = (this.clientiCache.length + 1).toString().padStart(4, '0');
    return `CL${anno}${numero}`;
  }
}

export default new ClientiService();
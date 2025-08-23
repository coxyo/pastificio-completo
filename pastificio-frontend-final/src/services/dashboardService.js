const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

class DashboardService {
  constructor() {
    this.token = null;
    this.loadToken();
  }

  loadToken() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('token');
    }
  }

  getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': this.token ? `Bearer ${this.token}` : ''
    };
  }

  async getStatistiche() {
    try {
      const response = await fetch(`${API_URL}/dashboard/stats`, {
        headers: this.getHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Errore nel recupero delle statistiche');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Errore dashboard service:', error);
      // Ritorna dati mock in caso di errore
      return {
        ordiniOggi: 0,
        valoreOggi: 0,
        ordiniSettimana: 0,
        valoreSettimana: 0,
        ordiniMese: 0,
        valoreMese: 0,
        ticketMedio: 0,
        tassoCompletamento: 0
      };
    }
  }

  async getOrdiniRecenti() {
    try {
      const response = await fetch(`${API_URL}/ordini?limit=5&sort=-createdAt`, {
        headers: this.getHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Errore nel recupero degli ordini');
      }
      
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Errore recupero ordini:', error);
      return [];
    }
  }

  async getProdottiVenduti() {
    try {
      const response = await fetch(`${API_URL}/dashboard/prodotti`, {
        headers: this.getHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Errore nel recupero dei prodotti');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Errore recupero prodotti:', error);
      return [];
    }
  }

  async getKPI() {
    try {
      const response = await fetch(`${API_URL}/dashboard/kpi`, {
        headers: this.getHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Errore nel recupero KPI');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Errore recupero KPI:', error);
      return {
        ordiniTotali: 0,
        valoreTotale: 0,
        ticketMedio: 0,
        tassoCompletamento: 0
      };
    }
  }
}

const dashboardService = new DashboardService();
export default dashboardService;
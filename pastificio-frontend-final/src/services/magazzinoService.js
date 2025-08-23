// src/services/magazzinoService.js
const API_BASE_URL = 'http://localhost:5000/api';

class MagazzinoService {
  async fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem('token');
    
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    };

    try {
      const response = await fetch(`${API_BASE_URL}${url}`, {
        ...defaultOptions,
        ...options,
        headers: {
          ...defaultOptions.headers,
          ...options.headers
        }
      });

      // Se la risposta è 404, non è un errore critico
      if (response.status === 404) {
        console.log('API non trovata, uso dati offline');
        return null;
      }

      if (!response.ok && response.status !== 404) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Errore fetch:', error);
      return null;
    }
  }

  async getMovimenti() {
    return this.fetchWithAuth('/magazzino/movimenti');
  }

  async getGiacenze() {
    return this.fetchWithAuth('/magazzino/giacenze');
  }

  async createMovimento(movimento) {
    return this.fetchWithAuth('/magazzino/movimenti', {
      method: 'POST',
      body: JSON.stringify(movimento)
    });
  }

  async updateMovimento(id, movimento) {
    return this.fetchWithAuth(`/magazzino/movimenti/${id}`, {
      method: 'PUT',
      body: JSON.stringify(movimento)
    });
  }

  async deleteMovimento(id) {
    return this.fetchWithAuth(`/magazzino/movimenti/${id}`, {
      method: 'DELETE'
    });
  }
}

export default new MagazzinoService();
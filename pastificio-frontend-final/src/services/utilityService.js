export const UtilityService = {
  /**
   * Formatta una data nel formato italiano
   */
  formatDate: (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('it-IT', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  },

  /**
   * Formatta un orario nel formato 24h
   */
  formatTime: (time) => {
    if (!time) return '';
    return time.toString().padStart(5, '0');
  },

  /**
   * Formatta un numero come prezzo in euro
   */
  formatPrice: (price) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  },

  /**
   * Formatta una quantità con unità di misura
   */
  formatQuantity: (quantity, unit) => {
    const formattedQuantity = Number(quantity).toLocaleString('it-IT', {
      minimumFractionDigits: unit === 'unità' ? 0 : 2,
      maximumFractionDigits: unit === 'unità' ? 0 : 2
    });
    return `${formattedQuantity} ${unit}`;
  },

  /**
   * Calcola il totale di un ordine
   */
  calculateOrderTotal: (products) => {
    return products.reduce((total, p) => total + p.prezzo, 0);
  },

  /**
   * Raggruppa gli ordini per data
   */
  groupOrdersByDate: (orders) => {
    return orders.reduce((groups, order) => {
      const date = order.dataRitiro.split('T')[0];
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(order);
      return groups;
    }, {});
  },

  /**
   * Filtra gli ordini in base a criteri multipli
   */
  filterOrders: (orders, filters) => {
    return orders.filter(order => {
      let passesFilter = true;
      
      if (filters.dateFrom) {
        passesFilter = passesFilter && order.dataRitiro >= filters.dateFrom;
      }
      
      if (filters.dateTo) {
        passesFilter = passesFilter && order.dataRitiro <= filters.dateTo;
      }
      
      if (filters.customer) {
        passesFilter = passesFilter && order.nomeCliente.toLowerCase()
          .includes(filters.customer.toLowerCase());
      }
      
      if (filters.status) {
        passesFilter = passesFilter && order.stato === filters.status;
      }
      
      return passesFilter;
    });
  },

  /**
   * Genera un report riassuntivo degli ordini
   */
  generateOrdersSummary: (orders) => {
    const summary = {
      totalOrders: orders.length,
      totalValue: 0,
      byProduct: {},
      byCategory: {},
      byStatus: {}
    };

    orders.forEach(order => {
      summary.totalValue += UtilityService.calculateOrderTotal(order.prodotti);
      
      // Conteggio per prodotto
      order.prodotti.forEach(p => {
        if (!summary.byProduct[p.prodotto]) {
          summary.byProduct[p.prodotto] = { quantity: 0, value: 0 };
        }
        summary.byProduct[p.prodotto].quantity += p.quantita;
        summary.byProduct[p.prodotto].value += p.prezzo;
      });

      // Conteggio per categoria
      const category = order.prodotti[0]?.categoria || 'Non specificata';
      if (!summary.byCategory[category]) {
        summary.byCategory[category] = { orders: 0, value: 0 };
      }
      summary.byCategory[category].orders++;
      summary.byCategory[category].value += UtilityService.calculateOrderTotal(order.prodotti);

      // Conteggio per stato
      if (!summary.byStatus[order.stato]) {
        summary.byStatus[order.stato] = 0;
      }
      summary.byStatus[order.stato]++;
    });

    return summary;
  },

  /**
   * Valida un ordine prima dell'invio
   */
  validateOrder: (order) => {
    const errors = [];
    
    if (!order.nomeCliente) {
      errors.push('Nome cliente obbligatorio');
    }
    
    if (!order.dataRitiro) {
      errors.push('Data ritiro obbligatoria');
    }
    
    if (!order.oraRitiro) {
      errors.push('Ora ritiro obbligatoria');
    }
    
    if (!order.prodotti || order.prodotti.length === 0) {
      errors.push('Aggiungere almeno un prodotto');
    } else {
      order.prodotti.forEach((p, index) => {
        if (!p.prodotto) {
          errors.push(`Prodotto ${index + 1}: nome obbligatorio`);
        }
        if (!p.quantita || p.quantita <= 0) {
          errors.push(`Prodotto ${index + 1}: quantità non valida`);
        }
      });
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  /**
   * Genera un ID univoco
   */
  generateId: () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  },

  /**
   * Calcola statistiche avanzate per gli ordini
   */
  calculateStatistics: (orders) => {
    const stats = {
      totalOrders: orders.length,
      totalValue: 0,
      averageOrderValue: 0,
      mostPopularProducts: [],
      productCategories: {},
      dailyStats: {},
      monthlyStats: {}
    };

    // Calcola totali e medie
    orders.forEach(order => {
      const total = UtilityService.calculateOrderTotal(order.prodotti);
      stats.totalValue += total;
      
      // Statistiche giornaliere
      const date = order.dataRitiro.split('T')[0];
      if (!stats.dailyStats[date]) {
        stats.dailyStats[date] = { orders: 0, value: 0 };
      }
      stats.dailyStats[date].orders++;
      stats.dailyStats[date].value += total;

      // Statistiche mensili
      const month = date.substring(0, 7);
      if (!stats.monthlyStats[month]) {
        stats.monthlyStats[month] = { orders: 0, value: 0 };
      }
      stats.monthlyStats[month].orders++;
      stats.monthlyStats[month].value += total;
    });

    // Calcola media per ordine
    stats.averageOrderValue = stats.totalValue / orders.length;

    // Calcola prodotti più popolari
    const productCounts = {};
    orders.forEach(order => {
      order.prodotti.forEach(p => {
        if (!productCounts[p.prodotto]) {
          productCounts[p.prodotto] = { count: 0, value: 0 };
        }
        productCounts[p.prodotto].count++;
        productCounts[p.prodotto].value += p.prezzo;
      });
    });

    stats.mostPopularProducts = Object.entries(productCounts)
      .sort(([,a], [,b]) => b.count - a.count)
      .slice(0, 5)
      .map(([name, stats]) => ({
        name,
        count: stats.count,
        value: stats.value
      }));

    return stats;
  },

  /**
   * Formatta un numero come percentuale
   */
  formatPercentage: (value, decimals = 1) => {
    return `${(value * 100).toFixed(decimals)}%`;
  }
};
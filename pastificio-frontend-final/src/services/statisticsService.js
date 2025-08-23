import { UtilityService } from './utilityService';

export const StatisticsService = {
  /**
   * Analisi delle vendite per periodo
   */
  analyzeSales: (orders, period = 'daily') => {
    const analysis = {
      data: {},
      totals: {
        orders: 0,
        revenue: 0,
        averageOrder: 0
      },
      trends: {
        growing: false,
        percentage: 0
      }
    };

    orders.forEach(order => {
      const date = order.dataRitiro;
      const total = UtilityService.calculateOrderTotal(order.prodotti);
      const key = period === 'daily' ? date.split('T')[0] :
                 period === 'monthly' ? date.substring(0, 7) :
                 date.substring(0, 4);

      if (!analysis.data[key]) {
        analysis.data[key] = {
          orders: 0,
          revenue: 0,
          products: {}
        };
      }

      analysis.data[key].orders++;
      analysis.data[key].revenue += total;
      analysis.totals.orders++;
      analysis.totals.revenue += total;

      // Traccia i prodotti venduti
      order.prodotti.forEach(p => {
        if (!analysis.data[key].products[p.prodotto]) {
          analysis.data[key].products[p.prodotto] = {
            quantity: 0,
            revenue: 0
          };
        }
        analysis.data[key].products[p.prodotto].quantity += p.quantita;
        analysis.data[key].products[p.prodotto].revenue += p.prezzo;
      });
    });

    // Calcola medie e tendenze
    analysis.totals.averageOrder = analysis.totals.revenue / analysis.totals.orders;

    const periods = Object.keys(analysis.data).sort();
    if (periods.length >= 2) {
      const lastPeriod = analysis.data[periods[periods.length - 1]].revenue;
      const previousPeriod = analysis.data[periods[periods.length - 2]].revenue;
      analysis.trends.growing = lastPeriod > previousPeriod;
      analysis.trends.percentage = ((lastPeriod - previousPeriod) / previousPeriod) * 100;
    }

    return analysis;
  },

  /**
   * Analisi dei prodotti più venduti
   */
  analyzeTopProducts: (orders, limit = 10) => {
    const products = {};

    orders.forEach(order => {
      order.prodotti.forEach(p => {
        if (!products[p.prodotto]) {
          products[p.prodotto] = {
            name: p.prodotto,
            quantity: 0,
            revenue: 0,
            orders: 0
          };
        }
        products[p.prodotto].quantity += p.quantita;
        products[p.prodotto].revenue += p.prezzo;
        products[p.prodotto].orders++;
      });
    });

    return Object.values(products)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit)
      .map(p => ({
        ...p,
        averageOrderValue: p.revenue / p.orders,
        percentageOfTotal: (p.revenue / orders.reduce((sum, o) => 
          sum + UtilityService.calculateOrderTotal(o.prodotti), 0)) * 100
      }));
  },

  /**
   * Analisi dei clienti
   */
  analyzeCustomers: (orders) => {
    const customers = {};

    orders.forEach(order => {
      if (!customers[order.nomeCliente]) {
        customers[order.nomeCliente] = {
          name: order.nomeCliente,
          orders: 0,
          totalSpent: 0,
          products: {},
          firstOrder: order.dataRitiro,
          lastOrder: order.dataRitiro
        };
      }

      const customer = customers[order.nomeCliente];
      customer.orders++;
      customer.totalSpent += UtilityService.calculateOrderTotal(order.prodotti);
      customer.lastOrder = order.dataRitiro > customer.lastOrder ? 
        order.dataRitiro : customer.lastOrder;

      order.prodotti.forEach(p => {
        if (!customer.products[p.prodotto]) {
          customer.products[p.prodotto] = {
            quantity: 0,
            spent: 0
          };
        }
        customer.products[p.prodotto].quantity += p.quantita;
        customer.products[p.prodotto].spent += p.prezzo;
      });
    });

    return Object.values(customers).map(c => ({
      ...c,
      averageOrderValue: c.totalSpent / c.orders,
      favoriteProducts: Object.entries(c.products)
        .sort(([,a], [,b]) => b.quantity - a.quantity)
        .slice(0, 3)
        .map(([name, stats]) => ({
          name,
          quantity: stats.quantity,
          spent: stats.spent
        }))
    }));
  },

  /**
   * Previsioni basate sui dati storici
   */
  generateForecasts: (orders) => {
    const dailyAnalysis = StatisticsService.analyzeSales(orders, 'daily');
    const monthlyAnalysis = StatisticsService.analyzeSales(orders, 'monthly');

    // Calcola la media mobile degli ultimi 7 giorni
    const movingAverage = Object.entries(dailyAnalysis.data)
      .sort(([a], [b]) => new Date(a) - new Date(b))
      .map(([date, data], index, array) => {
        if (index < 6) return null;
        const weekData = array.slice(index - 6, index + 1);
        const weekAverage = weekData.reduce((sum, [,d]) => sum + d.revenue, 0) / 7;
        return { date, average: weekAverage };
      })
      .filter(Boolean);

    // Calcola la stagionalità (variazioni mensili)
    const monthlyAverages = Object.entries(monthlyAnalysis.data)
      .map(([month, data]) => ({
        month,
        average: data.revenue / new Date(month + '-01').getDate()
      }));

    return {
      shortTerm: {
        nextDay: movingAverage[movingAverage.length - 1]?.average || 0,
        trend: dailyAnalysis.trends
      },
      longTerm: {
        nextMonth: monthlyAverages[monthlyAverages.length - 1]?.average * 30 || 0,
        seasonality: monthlyAverages
      }
    };
  }
};
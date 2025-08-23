import { UtilityService } from './utilityService';

export const AnalyticsService = {
  /**
   * Analisi delle vendite per periodo
   */
  analyzeSalesByPeriod: (orders, period = 'daily') => {
    const sales = {};
    
    orders.forEach(order => {
      const date = new Date(order.dataRitiro);
      let key;
      
      switch(period) {
        case 'daily':
          key = date.toISOString().split('T')[0];
          break;
        case 'weekly':
          const week = Math.floor(date.getDate() / 7);
          key = `${date.getFullYear()}-W${week}`;
          break;
        case 'monthly':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        default:
          key = 'total';
      }

      if (!sales[key]) {
        sales[key] = {
          totalOrders: 0,
          totalValue: 0,
          products: {},
          categories: {}
        };
      }

      const dayStats = sales[key];
      dayStats.totalOrders++;
      dayStats.totalValue += UtilityService.calculateOrderTotal(order.prodotti);

      // Analisi prodotti
      order.prodotti.forEach(p => {
        if (!dayStats.products[p.prodotto]) {
          dayStats.products[p.prodotto] = { quantity: 0, value: 0 };
        }
        dayStats.products[p.prodotto].quantity += p.quantita;
        dayStats.products[p.prodotto].value += p.prezzo;

        // Analisi categorie
        const category = p.categoria || 'Altra';
        if (!dayStats.categories[category]) {
          dayStats.categories[category] = { quantity: 0, value: 0 };
        }
        dayStats.categories[category].quantity += p.quantita;
        dayStats.categories[category].value += p.prezzo;
      });
    });

    // Calcola medie e percentuali
    Object.values(sales).forEach(stats => {
      stats.averageOrderValue = stats.totalValue / stats.totalOrders;
      
      // Calcola percentuali per prodotti
      Object.entries(stats.products).forEach(([product, data]) => {
        data.percentage = (data.value / stats.totalValue) * 100;
      });
      
      // Calcola percentuali per categorie
      Object.entries(stats.categories).forEach(([category, data]) => {
        data.percentage = (data.value / stats.totalValue) * 100;
      });
    });

    return sales;
  },

  /**
   * Analisi dei trend
   */
  analyzeTrends: (orders) => {
    const monthlyData = this.analyzeSalesByPeriod(orders, 'monthly');
    const trends = {
      growth: {},
      seasonal: {},
      products: {},
      categories: {}
    };

    // Calcola crescita mese su mese
    const months = Object.keys(monthlyData).sort();
    months.forEach((month, index) => {
      if (index > 0) {
        const currentValue = monthlyData[month].totalValue;
        const previousValue = monthlyData[months[index - 1]].totalValue;
        trends.growth[month] = ((currentValue - previousValue) / previousValue) * 100;
      }
    });

    // Analisi stagionalità
    months.forEach(month => {
      const monthNum = parseInt(month.split('-')[1]);
      if (!trends.seasonal[monthNum]) {
        trends.seasonal[monthNum] = [];
      }
      trends.seasonal[monthNum].push(monthlyData[month].totalValue);
    });

    // Calcola medie stagionali
    Object.entries(trends.seasonal).forEach(([month, values]) => {
      trends.seasonal[month] = values.reduce((a, b) => a + b, 0) / values.length;
    });

    // Analisi trend prodotti
    months.forEach(month => {
      Object.entries(monthlyData[month].products).forEach(([product, data]) => {
        if (!trends.products[product]) {
          trends.products[product] = [];
        }
        trends.products[product].push({
          month,
          value: data.value,
          quantity: data.quantity
        });
      });
    });

    return trends;
  },

  /**
   * Previsioni vendite
   */
  generateForecast: (orders, daysAhead = 30) => {
    const dailyData = this.analyzeSalesByPeriod(orders, 'daily');
    const forecast = {
      daily: {},
      products: {},
      confidence: {}
    };

    // Calcola media mobile e deviazione standard
    const values = Object.values(dailyData).map(d => d.totalValue);
    const movingAverage = values.reduce((a, b) => a + b, 0) / values.length;
    const standardDeviation = Math.sqrt(
      values.reduce((sq, n) => sq + Math.pow(n - movingAverage, 2), 0) / values.length
    );

    // Genera previsioni
    const lastDate = new Date(Math.max(...orders.map(o => new Date(o.dataRitiro))));
    for (let i = 1; i <= daysAhead; i++) {
      const forecastDate = new Date(lastDate);
      forecastDate.setDate(forecastDate.getDate() + i);
      const dateKey = forecastDate.toISOString().split('T')[0];

      forecast.daily[dateKey] = {
        expectedValue: movingAverage,
        minValue: movingAverage - standardDeviation,
        maxValue: movingAverage + standardDeviation
      };
    }

    return forecast;
  },

  /**
   * Report delle performance
   */
  generatePerformanceReport: (orders) => {
    const report = {
      summary: {
        totalOrders: orders.length,
        totalValue: orders.reduce((sum, o) => sum + UtilityService.calculateOrderTotal(o.prodotti), 0)
      },
      metrics: {
        averageOrderValue: 0,
        topProducts: [],
        topCategories: [],
        customerMetrics: {}
      },
      trends: {}
    };

    // Calcola metriche
    report.metrics.averageOrderValue = report.summary.totalValue / report.summary.totalOrders;

    // Analisi clienti
    orders.forEach(order => {
      if (!report.metrics.customerMetrics[order.nomeCliente]) {
        report.metrics.customerMetrics[order.nomeCliente] = {
          orders: 0,
          totalValue: 0,
          averageValue: 0,
          products: new Set()
        };
      }

      const customer = report.metrics.customerMetrics[order.nomeCliente];
      customer.orders++;
      customer.totalValue += UtilityService.calculateOrderTotal(order.prodotti);
      order.prodotti.forEach(p => customer.products.add(p.prodotto));
      customer.averageValue = customer.totalValue / customer.orders;
    });

    return report;
  }
};
// src/services/__tests__/dashboardService.test.js
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import {
  getStatisticheGenerali,
  getStatisticheProdotti,
  getTrendVendite,
  getKpi,
  getAlerts,
  getAllDashboardData
} from '../dashboardService';

describe('dashboardService', () => {
  let mockAxios;
  
  beforeEach(() => {
    mockAxios = new MockAdapter(axios);
  });
  
  afterEach(() => {
    mockAxios.restore();
  });
  
  test('getStatisticheGenerali fetches and returns data correctly', async () => {
    const mockData = { 
      ordiniTotali: 120, 
      valore: 5600, 
      clientiUnici: 45 
    };
    
    mockAxios.onGet('/dashboard/stats').reply(200, { data: mockData });
    
    const result = await getStatisticheGenerali();
    
    expect(result).toEqual(mockData);
  });
  
  test('getStatisticheProdotti handles period parameter correctly', async () => {
    const mockData = { 
      categorieTop: [
        { categoria: 'Pasta', valore: 2500 },
        { categoria: 'Dolci', valore: 1500 }
      ]
    };
    
    mockAxios.onGet('/dashboard/prodotti', { params: { period: '30' } })
      .reply(200, { data: mockData });
    
    const result = await getStatisticheProdotti('30');
    
    expect(result).toEqual(mockData);
  });
  
  test('getTrendVendite defaults to 7 days if no parameter provided', async () => {
    const mockData = {
      labels: ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'],
      data: [1000, 1200, 800, 1500, 900, 600, 700]
    };
    
    mockAxios.onGet('/dashboard/trend', { params: { days: '7' } })
      .reply(200, { data: mockData });
    
    const result = await getTrendVendite();
    
    expect(result).toEqual(mockData);
  });
  
  test('getAllDashboardData fetches all data in parallel', async () => {
    const mockStats = { ordiniTotali: 120 };
    const mockProdotti = { categorieTop: [] };
    const mockTrend = { labels: [], data: [] };
    const mockKpi = { ticketMedio: 50 };
    const mockAlerts = { alerts: [] };
    
    mockAxios.onGet('/dashboard/stats').reply(200, { data: mockStats });
    mockAxios.onGet('/dashboard/prodotti').reply(200, { data: mockProdotti });
    mockAxios.onGet('/dashboard/trend').reply(200, { data: mockTrend });
    mockAxios.onGet('/dashboard/kpi').reply(200, { data: mockKpi });
    mockAxios.onGet('/dashboard/alerts').reply(200, { data: mockAlerts });
    
    const result = await getAllDashboardData();
    
    expect(result).toEqual({
      statistiche: mockStats,
      prodotti: mockProdotti,
      trend: mockTrend,
      kpi: mockKpi,
      alerts: mockAlerts
    });
  });
  
  test('handles API errors gracefully', async () => {
    mockAxios.onGet('/dashboard/stats').reply(500);
    
    await expect(getStatisticheGenerali()).rejects.toThrow();
  });
});
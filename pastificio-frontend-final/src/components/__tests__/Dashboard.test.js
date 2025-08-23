// src/components/__tests__/Dashboard.test.js
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Dashboard from '../Dashboard';
import * as dashboardService from '../../services/dashboardService';

// Mock delle dipendenze
jest.mock('../../services/dashboardService');
jest.mock('../../services/loggingService', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}));

// Mock per i componenti figli
jest.mock('../Dashboard/GraficoVendite', () => () => <div data-testid="grafico-vendite">Grafico Vendite</div>);
jest.mock('../Dashboard/OrdiniRecenti', () => () => <div data-testid="ordini-recenti">Ordini Recenti</div>);
jest.mock('../Dashboard/StatisticheWidget', () => () => <div data-testid="statistiche-widget">Statistiche Widget</div>);
jest.mock('../Dashboard/ClientiWidget', () => () => <div data-testid="clienti-widget">Clienti Widget</div>);
jest.mock('../Dashboard/AlertsWidget', () => () => <div data-testid="alerts-widget">Alerts Widget</div>);

describe('Dashboard Component', () => {
  beforeEach(() => {
    // Reset dei mock prima di ogni test
    jest.clearAllMocks();
    
    // Mockare i dati di ritorno dei servizi
    dashboardService.getStatisticheGenerali.mockResolvedValue({
      ordiniTotali: 100,
      valore: 5000,
      clientiUnici: 30
    });
    
    dashboardService.getStatisticheProdotti.mockResolvedValue({
      categorieTop: [
        { categoria: 'Pasta', valore: 2500 },
        { categoria: 'Dolci', valore: 1500 }
      ]
    });
    
    dashboardService.getTrendVendite.mockResolvedValue({
      labels: ['Lun', 'Mar', 'Mer'],
      data: [1000, 1200, 800]
    });
    
    dashboardService.getKpi.mockResolvedValue({
      ticketMedio: 50,
      tassoCompletamento: 85
    });
  });
  
  test('renders dashboard correctly', async () => {
    render(<Dashboard />);
    
    // Verificare che il titolo sia presente
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    
    // Verificare che i componenti figli siano renderizzati
    await waitFor(() => {
      expect(screen.getByTestId('grafico-vendite')).toBeInTheDocument();
      expect(screen.getByTestId('ordini-recenti')).toBeInTheDocument();
      expect(screen.getByTestId('statistiche-widget')).toBeInTheDocument();
      expect(screen.getByTestId('clienti-widget')).toBeInTheDocument();
      expect(screen.getByTestId('alerts-widget')).toBeInTheDocument();
    });
  });
  
  test('displays loading state and then data', async () => {
    render(<Dashboard />);
    
    // Inizialmente dovrebbe mostrare lo stato di caricamento
    expect(screen.getByText(/Caricamento dati/i)).toBeInTheDocument();
    
    // Dopo il caricamento dei dati, dovrebbe mostrare i KPI
    await waitFor(() => {
      expect(screen.getByText('100')).toBeInTheDocument(); // ordiniTotali
      expect(screen.getByText('€5000')).toBeInTheDocument(); // valore
      expect(screen.getByText('€50')).toBeInTheDocument(); // ticketMedio
    });
  });
  
  test('handles service error gracefully', async () => {
    // Simulare un errore nel servizio
    dashboardService.getStatisticheGenerali.mockRejectedValue(new Error('API error'));
    
    render(<Dashboard />);
    
    // Dovrebbe mostrare un messaggio di errore
    await waitFor(() => {
      expect(screen.getByText(/Errore nel caricamento dei dati/i)).toBeInTheDocument();
    });
  });
  
  test('updates period filter correctly', async () => {
    render(<Dashboard />);
    
    // Simulare il cambio di periodo
    const periodSelect = screen.getByLabelText(/Periodo/i);
    await userEvent.click(periodSelect);
    await userEvent.click(screen.getByText('Ultimi 30 giorni'));
    
    // Verificare che il servizio sia stato chiamato con il nuovo periodo
    expect(dashboardService.getStatisticheProdotti).toHaveBeenCalledWith('30');
    expect(dashboardService.getTrendVendite).toHaveBeenCalledWith('30');
  });
});
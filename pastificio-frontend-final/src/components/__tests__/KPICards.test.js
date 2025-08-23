// src/components/Dashboard/__tests__/KPICards.test.js
import { render, screen } from '@testing-library/react';
import KPICards from '../KPICards';

const mockData = {
  produzione: {
    totaleOrdiniOggi: 25,
    valoreOrdiniOggi: 1250.50,
    ordiniInLavorazione: 5,
    percentualeCompletamento: 75,
    ordiniCompletatiOggi: 15,
    ticketMedio: 50.02
  },
  sistema: {
    cpu: 45.5,
    memoria: 60.2,
    prestazioni: {
      tempoRispostaDB: 150
    }
  },
  backup: {
    totaleBackup: 10,
    ultimoBackup: new Date().toISOString()
  }
};

describe('KPICards Component', () => {
  it('renders all KPI cards correctly', () => {
    render(<KPICards data={mockData} />);
    
    // Verifica presenza titoli delle card
    expect(screen.getByText('Ordini Oggi')).toBeInTheDocument();
    expect(screen.getByText('Valore Ordini')).toBeInTheDocument();
    expect(screen.getByText('Completamento')).toBeInTheDocument();
  });

  it('formats currency values correctly', () => {
    render(<KPICards data={mockData} />);
    expect(screen.getByText('€ 1.250,50')).toBeInTheDocument();
  });

  it('shows correct percentages', () => {
    render(<KPICards data={mockData} />);
    expect(screen.getByText('75,0%')).toBeInTheDocument();
  });

  it('displays system status indicators', () => {
    render(<KPICards data={mockData} />);
    
    const cpuValue = screen.getByText('45.5%');
    expect(cpuValue).toBeInTheDocument();
    expect(cpuValue.closest('div')).toHaveClass('text-green-500');
  });
});
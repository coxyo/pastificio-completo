// src/components/__tests__/StatisticheCategorie.test.js
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import StatisticheCategorie from '../Dashboard/StatisticheCategorie';

// Mock della libreria recharts per evitare errori durante i test
jest.mock('recharts', () => {
  const OriginalModule = jest.requireActual('recharts');
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }) => (
      <div data-testid="responsive-container">{children}</div>
    ),
    PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
    Pie: () => <div data-testid="pie" />,
    Cell: () => <div data-testid="cell" />,
    Tooltip: () => <div data-testid="tooltip" />,
    Legend: () => <div data-testid="legend" />,
  };
});

describe('StatisticheCategorie Component', () => {
  const mockData = [
    { name: 'Pasta', value: 4500, percentuale: 45 },
    { name: 'Dolci', value: 3000, percentuale: 30 },
    { name: 'Panadas', value: 2500, percentuale: 25 },
  ];

  const mockProps = {
    data: mockData,
    title: 'Vendite per Categoria',
    loading: false,
    period: '7 giorni',
    onChangePeriod: jest.fn(),
  };

  test('renders with correct title', () => {
    render(<StatisticheCategorie {...mockProps} />);
    
    expect(screen.getByText('Vendite per Categoria')).toBeInTheDocument();
  });

  test('renders chart when data is available', () => {
    render(<StatisticheCategorie {...mockProps} />);
    
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
  });

  test('displays loading state correctly', () => {
    const loadingProps = {
      ...mockProps,
      loading: true
    };
    
    render(<StatisticheCategorie {...loadingProps} />);
    
    // Verifichiamo che ci sia uno skeleton loader o un indicatore di caricamento
    expect(document.querySelector('.skeleton-loader, .loading-indicator')).toBeInTheDocument();
  });

  test('handles empty data gracefully', () => {
    const emptyDataProps = {
      ...mockProps,
      data: []
    };
    
    render(<StatisticheCategorie {...emptyDataProps} />);
    
    // Verifichiamo che mostri un messaggio di nessun dato
    expect(screen.getByText(/Nessun dato disponibile/i)).toBeInTheDocument();
  });

  test('calls onChangePeriod when period selector is changed', () => {
    render(<StatisticheCategorie {...mockProps} />);
    
    // Cerca il selettore di periodo
    const periodSelector = screen.getByLabelText(/periodo/i) || 
                           screen.getByRole('combobox') || 
                           screen.getByTestId('period-selector');
    
    fireEvent.change(periodSelector, { target: { value: '30' } });
    
    expect(mockProps.onChangePeriod).toHaveBeenCalledWith('30');
  });

  test('displays all categories and their percentages', () => {
    render(<StatisticheCategorie {...mockProps} />);
    
    // Verifichiamo che vengano mostrate tutte le categorie e le loro percentuali
    expect(screen.getByText('Pasta')).toBeInTheDocument();
    expect(screen.getByText('45%')).toBeInTheDocument();
    
    expect(screen.getByText('Dolci')).toBeInTheDocument();
    expect(screen.getByText('30%')).toBeInTheDocument();
    
    expect(screen.getByText('Panadas')).toBeInTheDocument();
    expect(screen.getByText('25%')).toBeInTheDocument();
  });

  test('allows toggling between chart view and table view if implemented', () => {
    render(<StatisticheCategorie {...mockProps} />);
    
    // Se c'è un toggle per cambiare tra grafico e tabella, lo testiamo
    const viewToggle = screen.queryByLabelText(/visualizza come tabella|view as table/i);
    
    if (viewToggle) {
      fireEvent.click(viewToggle);
      
      // Verifichiamo che ora ci sia una tabella invece del grafico
      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.queryByTestId('pie-chart')).not.toBeInTheDocument();
    }
  });
});
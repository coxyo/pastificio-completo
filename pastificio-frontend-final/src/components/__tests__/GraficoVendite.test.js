// src/components/__tests__/GraficoVendite.test.js
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import GraficoVendite from '../Dashboard/GraficoVendite';

// Mock della libreria recharts per evitare errori durante i test
jest.mock('recharts', () => {
  const OriginalModule = jest.requireActual('recharts');
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }) => (
      <div data-testid="responsive-container">{children}</div>
    ),
    LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
    BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
    Line: () => <div data-testid="line" />,
    Bar: () => <div data-testid="bar" />,
    XAxis: () => <div data-testid="x-axis" />,
    YAxis: () => <div data-testid="y-axis" />,
    CartesianGrid: () => <div data-testid="cartesian-grid" />,
    Tooltip: () => <div data-testid="tooltip" />,
    Legend: () => <div data-testid="legend" />,
  };
});

describe('GraficoVendite Component', () => {
  const mockData = [
    { data: '2023-01-01', vendite: 1200, ordini: 15 },
    { data: '2023-01-02', vendite: 1500, ordini: 18 },
    { data: '2023-01-03', vendite: 900, ordini: 10 },
    { data: '2023-01-04', vendite: 1800, ordini: 22 },
    { data: '2023-01-05', vendite: 1300, ordini: 16 },
  ];

  const mockProps = {
    data: mockData,
    title: 'Andamento Vendite',
    loading: false,
    period: '7 giorni',
    onChangePeriod: jest.fn(),
  };

  test('renders with correct title', () => {
    render(<GraficoVendite {...mockProps} />);
    
    expect(screen.getByText('Andamento Vendite')).toBeInTheDocument();
  });

  test('renders chart when data is available', () => {
    render(<GraficoVendite {...mockProps} />);
    
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    // Verifichiamo il tipo di grafico predefinito (line o bar a seconda dell'implementazione)
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  test('displays loading state correctly', () => {
    const loadingProps = {
      ...mockProps,
      loading: true
    };
    
    render(<GraficoVendite {...loadingProps} />);
    
    // Verifichiamo che ci sia uno skeleton loader o un indicatore di caricamento
    // Questa verifica dipende da come è implementato il loading state nel componente
    expect(document.querySelector('.skeleton-loader, .loading-indicator')).toBeInTheDocument();
  });

  test('handles empty data gracefully', () => {
    const emptyDataProps = {
      ...mockProps,
      data: []
    };
    
    render(<GraficoVendite {...emptyDataProps} />);
    
    // Verifichiamo che mostri un messaggio di nessun dato
    expect(screen.getByText(/Nessun dato disponibile/i)).toBeInTheDocument();
  });

  test('switches between chart types if implemented', () => {
    render(<GraficoVendite {...mockProps} />);
    
    // Se il componente ha un selettore per cambiare tipo di grafico, testiamo il cambio
    const chartTypeSelector = screen.queryByLabelText(/tipo di grafico/i);
    
    if (chartTypeSelector) {
      fireEvent.change(chartTypeSelector, { target: { value: 'bar' } });
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    }
  });

  test('calls onChangePeriod when period selector is changed', () => {
    render(<GraficoVendite {...mockProps} />);
    
    // Cerca il selettore di periodo
    const periodSelector = screen.getByLabelText(/periodo/i) || 
                           screen.getByRole('combobox') || 
                           screen.getByTestId('period-selector');
    
    fireEvent.change(periodSelector, { target: { value: '30' } });
    
    expect(mockProps.onChangePeriod).toHaveBeenCalledWith('30');
  });
});
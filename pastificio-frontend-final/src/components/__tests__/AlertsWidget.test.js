// src/components/__tests__/AlertsWidget.test.js
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AlertsWidget from '../Dashboard/AlertsWidget';

describe('AlertsWidget Component', () => {
  const mockAlerts = [
    { 
      id: '1', 
      tipo: 'warning', 
      messaggio: 'Scorta bassa: Farina 00', 
      data: '2023-01-01T10:30:00Z',
      letto: false 
    },
    { 
      id: '2', 
      tipo: 'error', 
      messaggio: 'Ordine #123 in ritardo', 
      data: '2023-01-01T09:15:00Z',
      letto: false 
    },
    { 
      id: '3', 
      tipo: 'info', 
      messaggio: 'Nuova versione disponibile', 
      data: '2022-12-31T14:20:00Z',
      letto: true 
    }
  ];

  const mockProps = {
    alerts: mockAlerts,
    loading: false,
    onMarkAsRead: jest.fn(),
    onFilterChange: jest.fn()
  };

  test('renders alerts correctly', () => {
    render(<AlertsWidget {...mockProps} />);
    
    expect(screen.getByText('Scorta bassa: Farina 00')).toBeInTheDocument();
    expect(screen.getByText('Ordine #123 in ritardo')).toBeInTheDocument();
    expect(screen.getByText('Nuova versione disponibile')).toBeInTheDocument();
  });

  test('displays the correct number of alerts', () => {
    render(<AlertsWidget {...mockProps} />);
    
    // Verifichiamo che vengano mostrati tutti e 3 gli alert
    const alertElements = screen.getAllByRole('listitem');
    expect(alertElements.length).toBe(3);
  });

  test('displays loading state correctly', () => {
    const loadingProps = {
      ...mockProps,
      loading: true
    };
    
    render(<AlertsWidget {...loadingProps} />);
    
    // Verifichiamo che ci sia uno skeleton loader o un indicatore di caricamento
    expect(document.querySelector('.skeleton-loader, .loading-indicator')).toBeInTheDocument();
  });

  test('calls onMarkAsRead when an alert is marked as read', () => {
    render(<AlertsWidget {...mockProps} />);
    
    // Cerca il pulsante "Segna come letto" per il primo alert
    const markAsReadButton = screen.getAllByRole('button', { name: /segna come letto|mark as read/i })[0];
    
    fireEvent.click(markAsReadButton);
    
    expect(mockProps.onMarkAsRead).toHaveBeenCalledWith('1');
  });

  test('handles empty alerts list gracefully', () => {
    const emptyAlertsProps = {
      ...mockProps,
      alerts: []
    };
    
    render(<AlertsWidget {...emptyAlertsProps} />);
    
    // Verifichiamo che mostri un messaggio di nessun alert
    expect(screen.getByText(/nessun alert|no alerts/i)).toBeInTheDocument();
  });

  test('filters alerts by type if implemented', () => {
    render(<AlertsWidget {...mockProps} />);
    
    // Se c'è un filtro per tipo di alert, lo testiamo
    const filterSelect = screen.queryByLabelText(/filtra per tipo|filter by type/i);
    
    if (filterSelect) {
      fireEvent.change(filterSelect, { target: { value: 'warning' } });
      
      expect(mockProps.onFilterChange).toHaveBeenCalledWith('warning');
    }
  });

  test('shows alert type indicators', () => {
    render(<AlertsWidget {...mockProps} />);
    
    // Verifichiamo che ci siano indicatori per i diversi tipi di alert (warning, error, info)
    // Questo test dipende da come vengono visualizzati i tipi nel componente
    const alertElements = screen.getAllByRole('listitem');
    
    // Assumendo che il tipo sia rappresentato come una classe o un attributo di data
    expect(alertElements[0]).toHaveAttribute('data-alert-type', 'warning');
    expect(alertElements[1]).toHaveAttribute('data-alert-type', 'error');
    expect(alertElements[2]).toHaveAttribute('data-alert-type', 'info');
  });
});
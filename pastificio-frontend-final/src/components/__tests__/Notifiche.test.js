// src/components/__tests__/Notifiche.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react';
import Notifiche from '../Notifiche';
import { formatDistance } from 'date-fns';
import { it } from 'date-fns/locale';

describe('Notifiche Component', () => {
  const mockNotifiche = [
    { 
      id: 1, 
      messaggio: 'Nuovo ordine da Mario Rossi', 
      tipo: 'info', 
      timestamp: new Date().toISOString(),
      dettagli: { ordineId: 'ORD-001', totale: 150, prodotti: ['Culurgiones'] }
    },
    { 
      id: 2, 
      messaggio: 'Ordine completato', 
      tipo: 'success', 
      timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 ora fa
      dettagli: { ordineId: 'ORD-002' }
    },
    { 
      id: 3, 
      messaggio: 'Errore nel processamento', 
      tipo: 'error', 
      timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 ore fa
      dettagli: { error: 'Timeout', ordineId: 'ORD-003' }
    }
  ];

  // Test di rendering base
  it('renders notifications correctly', () => {
    render(<Notifiche notifiche={mockNotifiche} />);
    expect(screen.getByText('Nuovo ordine da Mario Rossi')).toBeInTheDocument();
    expect(screen.getByText('Ordine completato')).toBeInTheDocument();
    expect(screen.getByText('Errore nel processamento')).toBeInTheDocument();
  });

  // Test stili per tipo di notifica
  it('applies correct styles based on notification type', () => {
    render(<Notifiche notifiche={mockNotifiche} />);
    const infoNotifica = screen.getByText('Nuovo ordine da Mario Rossi').closest('[data-testid="notifica-item"]');
    const successNotifica = screen.getByText('Ordine completato').closest('[data-testid="notifica-item"]');
    const errorNotifica = screen.getByText('Errore nel processamento').closest('[data-testid="notifica-item"]');

    expect(infoNotifica).toHaveClass('bg-blue-50');
    expect(successNotifica).toHaveClass('bg-green-50');
    expect(errorNotifica).toHaveClass('bg-red-50');
  });

  // Test timestamp e formatDistance
  it('displays relative timestamps correctly', () => {
    render(<Notifiche notifiche={mockNotifiche} />);
    expect(screen.getByText(/pochi secondi fa/i)).toBeInTheDocument();
    expect(screen.getByText(/circa 1 ora fa/i)).toBeInTheDocument();
    expect(screen.getByText(/circa 2 ore fa/i)).toBeInTheDocument();
  });

  // Test dettagli espandibili
  it('expands notification details on click', () => {
    render(<Notifiche notifiche={mockNotifiche} />);
    fireEvent.click(screen.getByText('Nuovo ordine da Mario Rossi'));
    
    expect(screen.getByText('Ordine #ORD-001')).toBeInTheDocument();
    expect(screen.getByText('€150,00')).toBeInTheDocument();
    expect(screen.getByText('Culurgiones')).toBeInTheDocument();
  });

  // Test dismissione notifiche
  it('handles notification dismissal', () => {
    const onDismiss = jest.fn();
    render(<Notifiche notifiche={mockNotifiche} onDismiss={onDismiss} />);
    
    const closeButtons = screen.getAllByTestId('dismiss-button');
    fireEvent.click(closeButtons[0]);
    
    expect(onDismiss).toHaveBeenCalledWith(mockNotifiche[0].id);
  });

  // Test notifiche vuote
  it('handles empty notifications list', () => {
    render(<Notifiche notifiche={[]} />);
    expect(screen.getByText('Nessuna notifica')).toBeInTheDocument();
  });

  // Test scroll automatico
  it('scrolls to new notifications', () => {
    const { rerender } = render(<Notifiche notifiche={mockNotifiche} />);
    
    const newNotifica = {
      id: 4,
      messaggio: 'Nuova notifica',
      tipo: 'info',
      timestamp: new Date().toISOString()
    };

    const scrollIntoViewMock = jest.fn();
    window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;

    rerender(<Notifiche notifiche={[newNotifica, ...mockNotifiche]} />);
    expect(scrollIntoViewMock).toHaveBeenCalled();
  });

  // Test azioni su notifiche
  it('handles notification actions', () => {
    const onAction = jest.fn();
    render(<Notifiche notifiche={mockNotifiche} onAction={onAction} />);
    
    const actionButtons = screen.getAllByTestId('action-button');
    fireEvent.click(actionButtons[0]);
    
    expect(onAction).toHaveBeenCalledWith(mockNotifiche[0]);
  });

  // Test gruppi di notifiche
  it('groups similar notifications', () => {
    const similarNotifiche = [
      ...mockNotifiche,
      {
        id: 4,
        messaggio: 'Nuovo ordine da Mario Rossi',
        tipo: 'info',
        timestamp: new Date().toISOString()
      }
    ];

    render(<Notifiche notifiche={similarNotifiche} />);
    expect(screen.getByText('(2) Nuovo ordine da Mario Rossi')).toBeInTheDocument();
  });

  // Test filtro notifiche
  it('filters notifications by type', () => {
    render(<Notifiche notifiche={mockNotifiche} />);
    
    const filterSelect = screen.getByTestId('filter-select');
    fireEvent.change(filterSelect, { target: { value: 'error' } });

    expect(screen.queryByText('Nuovo ordine da Mario Rossi')).not.toBeInTheDocument();
    expect(screen.queryByText('Ordine completato')).not.toBeInTheDocument();
    expect(screen.getByText('Errore nel processamento')).toBeInTheDocument();
  });

  // Test limite notifiche
  it('limits the number of visible notifications', () => {
    const manyNotifiche = Array(20)
      .fill(null)
      .map((_, i) => ({
        id: i,
        messaggio: `Notifica ${i}`,
        tipo: 'info',
        timestamp: new Date().toISOString()
      }));

    render(<Notifiche notifiche={manyNotifiche} />);
    const notificheElements = screen.getAllByTestId('notifica-item');
    expect(notificheElements).toHaveLength(10); // Assume un limite di 10
  });
});
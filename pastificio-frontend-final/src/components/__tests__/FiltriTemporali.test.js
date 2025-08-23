// src/components/__tests__/FiltriTemporali.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react';
import FiltriTemporali from '../FiltriTemporali';

describe('FiltriTemporali Component', () => {
  const onChangeMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test rendering base
  it('renders all default period options', () => {
    render(<FiltriTemporali onChange={onChangeMock} value="oggi" />);
    
    expect(screen.getByText('Oggi')).toBeInTheDocument();
    expect(screen.getByText('Questa Settimana')).toBeInTheDocument();
    expect(screen.getByText('Questo Mese')).toBeInTheDocument();
    expect(screen.getByText('Quest\'Anno')).toBeInTheDocument();
  });

  // Test selezione periodo
  it('handles period changes', () => {
    render(<FiltriTemporali onChange={onChangeMock} value="oggi" />);
    
    const select = screen.getByTestId('periodo-select');
    fireEvent.change(select, { target: { value: 'settimana' } });
    
    expect(onChangeMock).toHaveBeenCalledWith('settimana');
  });

  // Test periodo personalizzato
  it('shows custom date range when enabled', () => {
    render(
      <FiltriTemporali 
        onChange={onChangeMock} 
        value="custom" 
        allowCustomRange={true} 
      />
    );

    expect(screen.getByTestId('data-inizio')).toBeInTheDocument();
    expect(screen.getByTestId('data-fine')).toBeInTheDocument();
  });

  // Test validazione date
  it('validates custom date range', async () => {
    render(
      <FiltriTemporali 
        onChange={onChangeMock} 
        value="custom" 
        allowCustomRange={true} 
      />
    );

    const dataInizio = screen.getByTestId('data-inizio');
    const dataFine = screen.getByTestId('data-fine');

    // Prova a impostare una data di fine precedente all'inizio
    fireEvent.change(dataInizio, { target: { value: '2024-01-15' } });
    fireEvent.change(dataFine, { target: { value: '2024-01-10' } });

    expect(screen.getByText('La data di fine deve essere successiva alla data di inizio')).toBeInTheDocument();
  });

  // Test periodi predefiniti
  it('provides quick selection periods', () => {
    render(<FiltriTemporali onChange={onChangeMock} showQuickSelect={true} />);
    
    const ultimaSettimana = screen.getByTestId('quick-last-week');
    fireEvent.click(ultimaSettimana);
    
    expect(onChangeMock).toHaveBeenCalledWith({
      start: expect.any(String),
      end: expect.any(String),
      label: 'Ultima Settimana'
    });
  });

  // Test persistenza selezione
  it('maintains selected period after re-render', () => {
    const { rerender } = render(
      <FiltriTemporali onChange={onChangeMock} value="settimana" />
    );
    
    rerender(<FiltriTemporali onChange={onChangeMock} value="settimana" />);
    expect(screen.getByTestId('periodo-select')).toHaveValue('settimana');
  });

  // Test disabilitazione date future
  it('disables future dates in custom range', () => {
    render(
      <FiltriTemporali 
        onChange={onChangeMock} 
        value="custom" 
        allowCustomRange={true} 
        disableFuture={true}
      />
    );

    const oggi = new Date().toISOString().split('T')[0];
    const dataFine = screen.getByTestId('data-fine');
    
    expect(dataFine).toHaveAttribute('max', oggi);
  });

  // Test formato date
  it('formats dates according to locale', () => {
    render(
      <FiltriTemporali 
        onChange={onChangeMock}
        value="custom"
        allowCustomRange={true}
        locale="it"
      />
    );

    const dataInizio = screen.getByTestId('data-inizio');
    fireEvent.change(dataInizio, { target: { value: '2024-01-15' } });

    expect(screen.getByText('15 gennaio 2024')).toBeInTheDocument();
  });
});
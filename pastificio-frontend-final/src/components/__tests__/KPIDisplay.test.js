// src/components/__tests__/KPIDisplay.test.js
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import KPIDisplay from '../Dashboard/KPIDisplay';

describe('KPIDisplay Component', () => {
  const mockProps = {
    title: 'Test KPI',
    value: 1500,
    unit: '€',
    icon: 'MoneyIcon',
    color: 'primary',
    percentChange: 10.5,
    period: 'rispetto a ieri',
    loading: false
  };

  test('renders with correct title and value', () => {
    render(<KPIDisplay {...mockProps} />);
    
    expect(screen.getByText('Test KPI')).toBeInTheDocument();
    expect(screen.getByText('1500 €')).toBeInTheDocument();
  });

  test('displays percentage change correctly for positive values', () => {
    render(<KPIDisplay {...mockProps} />);
    
    expect(screen.getByText('+10.5%')).toBeInTheDocument();
    expect(screen.getByText('rispetto a ieri')).toBeInTheDocument();
  });

  test('displays percentage change correctly for negative values', () => {
    const negativeProps = {
      ...mockProps,
      percentChange: -5.3
    };
    
    render(<KPIDisplay {...negativeProps} />);
    
    expect(screen.getByText('-5.3%')).toBeInTheDocument();
  });

  test('displays loading state correctly', () => {
    const loadingProps = {
      ...mockProps,
      loading: true
    };
    
    render(<KPIDisplay {...loadingProps} />);
    
    // Verifichiamo che ci sia uno skeleton loader o un indicatore di caricamento
    // Questa verifica dipende da come è implementato il loading state nel componente
    // Ad esempio, se usi uno skeleton, potresti verificare la presenza di una classe specifica
    expect(document.querySelector('.skeleton-loader, .loading-indicator')).toBeInTheDocument();
  });

  test('applies custom color correctly', () => {
    render(<KPIDisplay {...mockProps} />);
    
    // Verifichiamo che la classe di colore sia applicata all'elemento appropriato
    // Questo test dipende dalla tua implementazione specifica del componente
    expect(document.querySelector(`.color-${mockProps.color}`)).toBeInTheDocument();
  });

  test('handles missing percentage change gracefully', () => {
    const noChangeProps = {
      ...mockProps,
      percentChange: undefined
    };
    
    render(<KPIDisplay {...noChangeProps} />);
    
    // Verifichiamo che non ci siano errori e che il componente sia renderizzato senza la percentuale
    expect(screen.getByText('Test KPI')).toBeInTheDocument();
    expect(screen.getByText('1500 €')).toBeInTheDocument();
    expect(screen.queryByText('%')).not.toBeInTheDocument();
  });
});
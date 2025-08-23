// src/components/__tests__/TopProdotti.test.js
import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { act } from 'react';
import TopProdotti from '../TopProdotti';

describe('TopProdotti Component', () => {
  const mockProdotti = [
    { nome: 'Culurgiones', quantita: 100, valore: 1000, categoria: 'pasta' },
    { nome: 'Malloreddus', quantita: 75, valore: 750, categoria: 'pasta' },
    { nome: 'Seadas', quantita: 50, valore: 500, categoria: 'dolci' }
  ];

  // Test di rendering base
  it('renders component correctly with data', () => {
    render(<TopProdotti prodotti={mockProdotti} />);
    expect(screen.getByText('Prodotti Più Venduti')).toBeInTheDocument();
    mockProdotti.forEach(prodotto => {
      expect(screen.getByText(prodotto.nome)).toBeInTheDocument();
    });
  });

  // Test dati prodotti
  it('displays product quantities and values correctly', () => {
    render(<TopProdotti prodotti={mockProdotti} />);
    
    mockProdotti.forEach(prodotto => {
      const prodottoElement = screen.getByTestId(`prodotto-${prodotto.nome}`);
      expect(within(prodottoElement).getByText(prodotto.quantita.toString())).toBeInTheDocument();
      expect(within(prodottoElement).getByText(`€${prodotto.valore}`)).toBeInTheDocument();
    });
  });

  // Test ordinamento
  it('sorts products by quantity by default', () => {
    render(<TopProdotti prodotti={mockProdotti} />);
    const prodottiElements = screen.getAllByTestId('prodotto-item');
    expect(prodottiElements[0]).toHaveTextContent('Culurgiones');
    expect(prodottiElements[2]).toHaveTextContent('Seadas');
  });

  // Test filtri per categoria
  it('filters products by category', () => {
    render(<TopProdotti prodotti={mockProdotti} />);
    const categoriaSelect = screen.getByTestId('categoria-select');
    
    act(() => {
      fireEvent.change(categoriaSelect, { target: { value: 'pasta' } });
    });

    expect(screen.getByText('Culurgiones')).toBeInTheDocument();
    expect(screen.getByText('Malloreddus')).toBeInTheDocument();
    expect(screen.queryByText('Seadas')).not.toBeInTheDocument();
  });

  // Test grafico
  it('displays chart with correct data', () => {
    render(<TopProdotti prodotti={mockProdotti} />);
    const chart = screen.getByTestId('prodotti-chart');
    expect(chart).toBeInTheDocument();
  });

  // Test percentuali
  it('calculates and displays percentages correctly', () => {
    render(<TopProdotti prodotti={mockProdotti} />);
    const totale = mockProdotti.reduce((acc, curr) => acc + curr.quantita, 0);
    
    mockProdotti.forEach(prodotto => {
      const percentuale = ((prodotto.quantita / totale) * 100).toFixed(1);
      expect(screen.getByText(`${percentuale}%`)).toBeInTheDocument();
    });
  });

  // Test gestione dati vuoti
  it('handles empty data gracefully', () => {
    render(<TopProdotti prodotti={[]} />);
    expect(screen.getByText('Nessun prodotto disponibile')).toBeInTheDocument();
  });

  // Test gestione dati nulli
  it('handles null and undefined data', () => {
    render(<TopProdotti prodotti={null} />);
    expect(screen.getByText('Nessun prodotto disponibile')).toBeInTheDocument();
  });

  // Test tooltip
  it('shows detailed tooltip on hover', async () => {
    render(<TopProdotti prodotti={mockProdotti} />);
    const firstProduct = screen.getByTestId('prodotto-Culurgiones');
    
    fireEvent.mouseEnter(firstProduct);
    
    expect(await screen.findByText('Dettagli Prodotto')).toBeInTheDocument();
    expect(await screen.findByText('Quantità totale: 100')).toBeInTheDocument();
    expect(await screen.findByText('Valore totale: €1000')).toBeInTheDocument();
  });

  // Test responsive layout
  it('applies correct responsive classes', () => {
    render(<TopProdotti prodotti={mockProdotti} />);
    const container = screen.getByTestId('top-prodotti-container');
    expect(container).toHaveClass('md:col-span-1', 'lg:col-span-1');
  });

  // Test aggiornamenti
  it('updates when receiving new data', () => {
    const { rerender } = render(<TopProdotti prodotti={mockProdotti} />);
    
    const nuoviProdotti = [
      ...mockProdotti,
      { nome: 'Pardulas', quantita: 120, valore: 1200, categoria: 'dolci' }
    ];
    
    rerender(<TopProdotti prodotti={nuoviProdotti} />);
    expect(screen.getByText('Pardulas')).toBeInTheDocument();
  });

  // Test performance
  it('memoizes calculations for performance', () => {
    const { rerender } = render(<TopProdotti prodotti={mockProdotti} />);
    const initialCalcs = screen.getAllByTestId('percentuale');
    
    rerender(<TopProdotti prodotti={mockProdotti} />);
    const newCalcs = screen.getAllByTestId('percentuale');
    
    expect(initialCalcs).toEqual(newCalcs);
  });
});
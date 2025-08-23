// src/components/Dashboard/__tests__/OrdiniOggi.test.js
import { render, screen, fireEvent } from '@testing-library/react';
import OrdiniOggi from '../OrdiniOggi';

const mockOrdini = [
 {
   _id: '1',
   nomeCliente: 'Mario Rossi',
   telefono: '1234567890',
   oraRitiro: '14:30',
   stato: 'in_lavorazione',
   prodotti: [
     { prodotto: 'Pardulas', quantita: 1, unita: 'Kg', prezzo: 18 },
     { prodotto: 'Amaretti', quantita: 0.5, unita: 'Kg', prezzo: 20 }
   ],
   totale: 28
 },
 {
   _id: '2', 
   nomeCliente: 'Giuseppe Verdi',
   telefono: '0987654321',
   oraRitiro: '15:00',
   stato: 'completato',
   prodotti: [
     { prodotto: 'Culurgiones', quantita: 2, unita: 'Kg', prezzo: 14 }
   ],
   totale: 28
 }
];

describe('OrdiniOggi Component', () => {
 it('renders table with correct headers', () => {
   render(<OrdiniOggi ordini={mockOrdini} />);
   
   expect(screen.getByText('Ora Ritiro')).toBeInTheDocument();
   expect(screen.getByText('Cliente')).toBeInTheDocument();
   expect(screen.getByText('Prodotti')).toBeInTheDocument();
   expect(screen.getByText('Totale')).toBeInTheDocument();
   expect(screen.getByText('Stato')).toBeInTheDocument();
 });

 it('displays order details correctly', () => {
   render(<OrdiniOggi ordini={mockOrdini} />);
   
   expect(screen.getByText('Mario Rossi')).toBeInTheDocument();
   expect(screen.getByText('1234567890')).toBeInTheDocument();
   expect(screen.getByText('14:30')).toBeInTheDocument();
   expect(screen.getByText('€ 28,00')).toBeInTheDocument();
 });

 it('filters orders by status', () => {
   render(<OrdiniOggi ordini={mockOrdini} />);
   
   const selectStato = screen.getByRole('combobox');
   fireEvent.change(selectStato, { target: { value: 'completato' } });
   
   expect(screen.getByText('Giuseppe Verdi')).toBeInTheDocument();
   expect(screen.queryByText('Mario Rossi')).not.toBeInTheDocument();
 });

 it('filters orders by search text', () => {
   render(<OrdiniOggi ordini={mockOrdini} />);
   
   const searchInput = screen.getByPlaceholderText('Cerca per cliente o telefono...');
   fireEvent.change(searchInput, { target: { value: 'Mario' } });
   
   expect(screen.getByText('Mario Rossi')).toBeInTheDocument();
   expect(screen.queryByText('Giuseppe Verdi')).not.toBeInTheDocument();
 });

 it('shows correct order totals', () => {
   render(<OrdiniOggi ordini={mockOrdini} />);
   
   expect(screen.getByText('Totale: 2 ordini')).toBeInTheDocument();
   expect(screen.getByText('1')).toBeInTheDocument(); // un ordine completato
   expect(screen.getByText('1')).toBeInTheDocument(); // un ordine in lavorazione
 });

 it('formats products list correctly', () => {
   render(<OrdiniOggi ordini={mockOrdini} />);
   
   expect(screen.getByText('1 Kg - Pardulas')).toBeInTheDocument();
   expect(screen.getByText('0.5 Kg - Amaretti')).toBeInTheDocument();
 });

 it('handles empty orders array', () => {
   render(<OrdiniOggi ordini={[]} />);
   
   expect(screen.getByText('Totale: 0 ordini')).toBeInTheDocument();
 });
});
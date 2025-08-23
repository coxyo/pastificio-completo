// src/components/Dashboard/__tests__/GraficoOrdini.test.js
import { render, screen } from '@testing-library/react';
import GraficoOrdini from '../GraficoOrdini';

const mockDatiOrari = [
 {
   _id: "09",
   numeroOrdini: 5,
   valoreTotale: 150
 },
 {
   _id: "10",
   numeroOrdini: 8,
   valoreTotale: 240
 },
 {
   _id: "11",
   numeroOrdini: 12,
   valoreTotale: 360
 }
];

const mockPrevisioni = [
 {
   ora: 9,
   ordiniPrevisti: 6,
   valorePrevisto: 180
 },
 {
   ora: 10,
   ordiniPrevisti: 9,
   valorePrevisto: 270
 },
 {
   ora: 11,
   ordiniPrevisti: 10,
   valorePrevisto: 300
 }
];

describe('GraficoOrdini Component', () => {
 it('renders chart container correctly', () => {
   render(<GraficoOrdini datiOrari={mockDatiOrari} previsioni={mockPrevisioni} />);
   expect(screen.getByRole('region')).toBeInTheDocument();
 });

 it('displays correct title and badges', () => {
   render(<GraficoOrdini datiOrari={mockDatiOrari} previsioni={mockPrevisioni} />);
   expect(screen.getByText('Distribuzione Oraria Ordini')).toBeInTheDocument();
   expect(screen.getByText('Ordini Reali')).toBeInTheDocument();
   expect(screen.getByText('Previsioni')).toBeInTheDocument();
 });

 it('calculates and displays statistics correctly', () => {
   render(<GraficoOrdini datiOrari={mockDatiOrari} previsioni={mockPrevisioni} />);
   
   // Totale ordini
   const totaleOrdini = mockDatiOrari.reduce((acc, d) => acc + d.numeroOrdini, 0);
   expect(screen.getByText(totaleOrdini.toString())).toBeInTheDocument();
   
   // Valore totale
   const valoreFormattato = new Intl.NumberFormat('it-IT', { 
     style: 'currency', 
     currency: 'EUR' 
   }).format(mockDatiOrari.reduce((acc, d) => acc + d.valoreTotale, 0));
   expect(screen.getByText(valoreFormattato)).toBeInTheDocument();
   
   // Media ordini/ora
   const mediaOrdini = (totaleOrdini / mockDatiOrari.length).toFixed(1);
   expect(screen.getByText(mediaOrdini)).toBeInTheDocument();
 });

 it('shows ora di picco correctly', () => {
   render(<GraficoOrdini datiOrari={mockDatiOrari} previsioni={mockPrevisioni} />);
   
   const oraPicco = mockDatiOrari.reduce((max, d) => 
     d.numeroOrdini > max.numeroOrdini ? d : max
   )._id;
   expect(screen.getByText(`${oraPicco}:00`)).toBeInTheDocument();
 });

 it('handles empty data gracefully', () => {
   render(<GraficoOrdini datiOrari={[]} previsioni={[]} />);
   expect(screen.getByText('Nessun dato disponibile')).toBeInTheDocument();
 });

 it('shows current time reference line', () => {
   render(<GraficoOrdini datiOrari={mockDatiOrari} previsioni={mockPrevisioni} />);
   expect(screen.getByText('Ora corrente')).toBeInTheDocument();
 });

 it('formats axis labels correctly', () => {
   render(<GraficoOrdini datiOrari={mockDatiOrari} previsioni={mockPrevisioni} />);
   mockDatiOrari.forEach(dato => {
     expect(screen.getByText(`${dato._id}:00`)).toBeInTheDocument();
   });
 });

 it('displays tooltip data correctly on hover', async () => {
   render(<GraficoOrdini datiOrari={mockDatiOrari} previsioni={mockPrevisioni} />);
   
   // Simula hover sul primo punto dati
   const primoDataPoint = screen.getByTestId('data-point-0');
   fireEvent.mouseOver(primoDataPoint);
   
   // Verifica contenuto tooltip
   expect(await screen.findByText('09:00')).toBeInTheDocument();
   expect(await screen.findByText('5 ordini')).toBeInTheDocument();
   expect(await screen.findByText('€ 150,00')).toBeInTheDocument();
 });
});
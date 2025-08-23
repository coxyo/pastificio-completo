// src/components/Dashboard/__tests__/SystemStatus.test.js
import { render, screen } from '@testing-library/react';
import SystemStatus from '../SystemStatus';

const mockStatus = {
 cpu: 75.5,
 memoria: 82.3,
 uptime: '5 giorni, 6 ore',
 stato: 'warning',
 prestazioni: {
   tempoRispostaDB: 180,
   richiesteAlMinuto: 250,
   statisticheDB: {
     connections: 15
   }
 },
 alerts: [
   {
     tipo: 'warning',
     messaggio: 'Utilizzo memoria elevato'
   },
   {
     tipo: 'critical',
     messaggio: 'Tempo risposta database critico'
   }
 ]
};

describe('SystemStatus Component', () => {
 it('renders all system metrics', () => {
   render(<SystemStatus status={mockStatus} />);
   
   expect(screen.getByText('CPU')).toBeInTheDocument();
   expect(screen.getByText('Memoria')).toBeInTheDocument();
   expect(screen.getByText('Database')).toBeInTheDocument();
 });

 it('shows correct status colors based on thresholds', () => {
   render(<SystemStatus status={mockStatus} />);
   
   // CPU warning (75.5%)
   const cpuValue = screen.getByText('75.5%');
   expect(cpuValue).toHaveClass('text-yellow-500');
   
   // Memoria critical (82.3%)
   const memoriaValue = screen.getByText('82.3%');
   expect(memoriaValue).toHaveClass('text-red-500');
 });

 it('displays progress bars with correct values', () => {
   render(<SystemStatus status={mockStatus} />);
   
   const cpuProgress = screen.getByTestId('cpu-progress');
   expect(cpuProgress).toHaveAttribute('value', '75.5');
   
   const memoriaProgress = screen.getByTestId('memoria-progress');
   expect(memoriaProgress).toHaveAttribute('value', '82.3');
 });

 it('shows database performance metrics', () => {
   render(<SystemStatus status={mockStatus} />);
   
   expect(screen.getByText('180ms')).toBeInTheDocument();
   expect(screen.getByText('15 connessioni attive')).toBeInTheDocument();
 });

 it('displays uptime and requests per minute', () => {
   render(<SystemStatus status={mockStatus} />);
   
   expect(screen.getByText('5 giorni, 6 ore')).toBeInTheDocument();
   expect(screen.getByText('250')).toBeInTheDocument();
 });

 it('renders system alerts correctly', () => {
   render(<SystemStatus status={mockStatus} />);
   
   expect(screen.getByText('Utilizzo memoria elevato')).toBeInTheDocument();
   expect(screen.getByText('Tempo risposta database critico')).toBeInTheDocument();
 });

 it('applies correct alert styles', () => {
   render(<SystemStatus status={mockStatus} />);
   
   const warningAlert = screen.getByText('Utilizzo memoria elevato').closest('div');
   expect(warningAlert).toHaveClass('bg-yellow-100');
   
   const criticalAlert = screen.getByText('Tempo risposta database critico').closest('div');
   expect(criticalAlert).toHaveClass('bg-red-100');
 });

 it('shows overall system status indicator', () => {
   render(<SystemStatus status={mockStatus} />);
   
   expect(screen.getByText('warning')).toBeInTheDocument();
   expect(screen.getByTestId('status-indicator')).toHaveClass('text-yellow-500');
 });

 it('handles missing or partial data gracefully', () => {
   const partialStatus = {
     cpu: 50,
     memoria: 60
   };
   
   render(<SystemStatus status={partialStatus} />);
   
   expect(screen.getByText('50%')).toBeInTheDocument();
   expect(screen.getByText('60%')).toBeInTheDocument();
   expect(screen.queryByText('undefined')).not.toBeInTheDocument();
 });

 it('updates progress bar colors based on values', () => {
   render(<SystemStatus status={mockStatus} />);
   
   const cpuProgress = screen.getByTestId('cpu-progress');
   expect(cpuProgress).toHaveClass('bg-yellow-500'); // 75.5%
   
   const memoriaProgress = screen.getByTestId('memoria-progress');
   expect(memoriaProgress).toHaveClass('bg-red-500'); // 82.3%
 });
});
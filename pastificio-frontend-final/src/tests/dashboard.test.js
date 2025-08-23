// src/tests/dashboard.test.js
import { render, screen, waitFor } from '@testing-library/react';
import Dashboard from '../components/Dashboard';
import dashboardService from '../services/dashboardService';

jest.mock('../services/dashboardService');

describe('Dashboard', () => {
  beforeEach(() => {
    dashboardService.getStatisticheGenerali.mockResolvedValue({
      success: true,
      data: {
        ordiniOggi: 10,
        ordiniSettimana: 50,
        totaleValore: 5000
      }
    });
  });

  test('mostra KPI correttamente', async () => {
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByText('€5000')).toBeInTheDocument();
    });
  });
});
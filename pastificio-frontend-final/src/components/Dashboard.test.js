// src/components/Dashboard.test.js (versione semplificata per i test)
import React from 'react';

const Dashboard = () => {
  return (
    <div data-testid="dashboard-container">
      <h1>Dashboard</h1>
      <div className="dashboard-content">
        <p>Contenuto dashboard per test</p>
      </div>
    </div>
  );
};

export default Dashboard;
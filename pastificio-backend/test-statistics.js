// test-statistics.js
import fetch from 'node-fetch';

const API_URL = 'http://localhost:5000/api';
const TOKEN = 'INSERISCI_QUI_IL_TOKEN'; // <-- Metti il token ottenuto

async function testStatistics() {
  try {
    console.log('🧪 Test API Statistics\n');
    
    // Test dashboard stats
    console.log('📊 Testing Dashboard Stats...');
    const stats = await fetch(`${API_URL}/dashboard/stats`, {
      headers: { 'Authorization': `Bearer ${TOKEN}` }
    });
    
    if (stats.ok) {
      const data = await stats.json();
      console.log('Dashboard Stats:', JSON.stringify(data, null, 2));
    } else {
      console.log('Errore:', await stats.text());
    }
    
    // Test KPI
    console.log('\n📈 Testing KPI...');
    const kpi = await fetch(`${API_URL}/dashboard/kpi`, {
      headers: { 'Authorization': `Bearer ${TOKEN}` }
    });
    
    if (kpi.ok) {
      const data = await kpi.json();
      console.log('KPI:', JSON.stringify(data, null, 2));
    } else {
      console.log('Errore:', await kpi.text());
    }

    // Test Export
    console.log('\n📄 Testing Export...');
    const exportTest = await fetch(`${API_URL}/export/ordini`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        format: 'excel',
        startDate: '2024-01-01',
        endDate: '2024-12-31'
      })
    });
    
    if (exportTest.ok) {
      console.log('Export response headers:', exportTest.headers);
    } else {
      console.log('Export error:', await exportTest.text());
    }

  } catch (error) {
    console.error('❌ Errore:', error.message);
  }
}

testStatistics();
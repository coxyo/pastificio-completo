// test-export.js
import fetch from 'node-fetch';

const API_URL = 'http://localhost:5000/api';
const TOKEN = 'INSERISCI_QUI_IL_TOKEN'; // <-- Metti il token ottenuto

async function testExport() {
  try {
    console.log('🧪 Test Export API\n');
    
    // Test tutti i formati di export
    const formats = ['excel', 'pdf', 'csv'];
    
    for (const format of formats) {
      console.log(`\n📊 Testing Export ${format.toUpperCase()}...`);
      
      const response = await fetch(`${API_URL}/export/ordini`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          format: format,
          startDate: '2024-01-01',
          endDate: '2024-12-31'
        })
      });
      
      if (response.ok) {
        console.log(`✅ Export ${format} OK`);
        console.log('Content-Type:', response.headers.get('content-type'));
        console.log('Content-Disposition:', response.headers.get('content-disposition'));
      } else {
        const error = await response.text();
        console.log(`❌ Export ${format} fallito:`, error);
      }
    }
    
  } catch (error) {
    console.error('❌ Errore:', error.message);
  }
}

testExport();
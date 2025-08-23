// app/api/magazzino/dashboard/route.js
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    // Simula i dati del dashboard
    const dashboardData = {
      statistiche: {
        totaleIngredients: 15,
        scorteInEsaurimento: 3,
        valoreInventario: 2500.50,
        movimentiOggi: 8
      },
      ultimiMovimenti: [
        {
          id: 1,
          tipo: 'entrata',
          ingrediente: 'Farina 00',
          quantita: 50,
          unita: 'kg',
          data: new Date().toISOString(),
          utente: 'Admin'
        },
        {
          id: 2,
          tipo: 'uscita',
          ingrediente: 'Zucchero',
          quantita: 10,
          unita: 'kg',
          data: new Date().toISOString(),
          utente: 'Admin'
        }
      ],
      alerti: [
        {
          id: 1,
          tipo: 'warning',
          messaggio: 'Farina 00 sotto scorta minima',
          ingrediente: 'Farina 00',
          quantitaAttuale: 20,
          quantitaMinima: 50
        }
      ]
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('Errore dashboard magazzino:', error);
    return NextResponse.json(
      { error: 'Errore nel recupero dei dati del dashboard' },
      { status: 500 }
    );
  }
}
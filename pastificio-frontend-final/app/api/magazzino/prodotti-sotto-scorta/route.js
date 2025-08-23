// app/api/magazzino/prodotti-sotto-scorta/route.js
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    // Simula i dati dei prodotti sotto scorta
    const prodottiSottoScorta = [
      {
        id: 1,
        nome: 'Farina 00',
        quantitaAttuale: 20,
        quantitaMinima: 50,
        unita: 'kg',
        percentuale: 40
      },
      {
        id: 2,
        nome: 'Zucchero',
        quantitaAttuale: 5,
        quantitaMinima: 20,
        unita: 'kg',
        percentuale: 25
      },
      {
        id: 3,
        nome: 'Uova',
        quantitaAttuale: 30,
        quantitaMinima: 100,
        unita: 'unità',
        percentuale: 30
      }
    ];

    return NextResponse.json(prodottiSottoScorta);
  } catch (error) {
    console.error('Errore recupero prodotti sotto scorta:', error);
    return NextResponse.json(
      { error: 'Errore nel recupero dei prodotti sotto scorta' },
      { status: 500 }
    );
  }
}
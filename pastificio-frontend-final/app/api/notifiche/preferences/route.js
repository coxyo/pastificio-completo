// app/api/notifiche/preferences/route.js
import { NextResponse } from 'next/server';

// Mock data per test - sostituisci con database reale
let mockPreferences = {
  email: { enabled: false, address: '' },
  sms: { enabled: false, phoneNumber: '' },
  browser: { enabled: false }
};

export async function GET(request) {
  try {
    // Qui normalmente verificheresti il token JWT
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      );
    }

    // Simula il recupero delle preferenze dal database
    return NextResponse.json({
      success: true,
      preferences: mockPreferences
    });
  } catch (error) {
    console.error('Errore GET preferences:', error);
    return NextResponse.json(
      { error: 'Errore nel recupero delle preferenze' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    // Verifica autorizzazione
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      );
    }

    // Recupera i dati dal body della richiesta
    const body = await request.json();
    console.log('Preferenze ricevute:', body);

    // Valida i dati
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Dati non validi' },
        { status: 400 }
      );
    }

    // Simula il salvataggio nel database
    mockPreferences = { ...body };

    return NextResponse.json({
      success: true,
      message: 'Preferenze salvate con successo',
      preferences: mockPreferences
    });
  } catch (error) {
    console.error('Errore PUT preferences:', error);
    return NextResponse.json(
      { error: 'Errore nel salvataggio delle preferenze' },
      { status: 500 }
    );
  }
}

// Gestisci OPTIONS per CORS
export async function OPTIONS(request) {
  return new NextResponse(null, { status: 200 });
}
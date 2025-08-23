import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { title, message, type, channel } = body;

    // Qui puoi implementare la logica per inviare effettivamente le notifiche
    // Per ora, simuliamo un invio riuscito
    console.log('Invio notifica:', { title, message, type, channel });

    // Simula un piccolo delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Restituisci una risposta di successo
    return NextResponse.json({
      success: true,
      message: 'Notifica inviata con successo',
      data: {
        id: Date.now(),
        title,
        message,
        type,
        channel,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Errore invio notifica:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Errore durante l\'invio della notifica' 
      },
      { status: 500 }
    );
  }
}
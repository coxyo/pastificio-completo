/ tests/utils/test-helpers.js
import { User } from '../../models/User.js';

export const createTestOrdine = async (override = {}) => {
  const defaultOrdine = {
    nomeCliente: 'Test Cliente',
    telefono: '1234567890',
    dataRitiro: new Date('2024-12-07'),
    oraRitiro: '10:00',
    prodotti: [
      {
        nome: 'Test Prodotto',
        quantita: 2,
        prezzo: 18,
        unitaMisura: 'Kg'
      }
    ],
    deveViaggiare: false,
    note: 'Test ordine'
  };

  return await Ordine.create({
    ...defaultOrdine,
    ...override
  });
};

export const createTestUser = async (override = {}) => {
  const defaultUser = {
    username: 'testuser',
    password: 'Password123!',
    email: 'test@example.com',
    ruolo: 'operatore'
  };

  return await User.create({
    ...defaultUser,
    ...override
  });
};

export const getAuthToken = async () => {
  const user = await createTestUser();
  return user.getSignedJwtToken();
};
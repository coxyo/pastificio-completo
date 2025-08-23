// tests/unit/auth.test.js
import { User } from '../../models/User.js';
import jwt from 'jsonwebtoken';

describe('Auth Unit Tests', () => {
  const testUser = {
    username: 'testuser',
    password: 'Password123!',
    email: 'test@example.com'
  };

  describe('User Model', () => {
    it('dovrebbe hashare la password al salvataggio', async () => {
      const user = await User.create(testUser);
      expect(user.password).not.toBe(testUser.password);
    });

    it('dovrebbe validare le password correttamente', async () => {
      const user = await User.create(testUser);
      const isValid = await user.matchPassword(testUser.password);
      expect(isValid).toBe(true);
    });
  });

  describe('Token JWT', () => {
    it('dovrebbe generare un token valido', async () => {
      const user = await User.create(testUser);
      const token = user.getSignedJwtToken();
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      expect(decoded.id).toBe(user._id.toString());
    });
  });
});
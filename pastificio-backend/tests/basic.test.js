// tests/basic.test.js
import mongoose from 'mongoose';
import { User } from '../models/User.js';

describe('Basic Tests', () => {
  beforeAll(async () => {
    // La connessione è già gestita in setup.js
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('should create a new user', async () => {
    const user = await User.create({
      username: 'testuser',
      password: 'password123'
    });
    expect(user._id).toBeDefined();
    expect(user.username).toBe('testuser');
  });
});
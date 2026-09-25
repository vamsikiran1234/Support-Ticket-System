const request = require('supertest');
const bcrypt = require('bcrypt');
const app = require('../src/server');
const pool = require('../src/config/db');

// Mock database pool
jest.mock('../src/config/db', () => ({
  execute: jest.fn()
}));

describe('Authentication & User Management APIs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('successfully registers a new customer', async () => {
      pool.execute.mockResolvedValueOnce([{ insertId: 10 }]);

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Charlie Test',
          email: 'charlie@example.com',
          password: 'Password123!'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id', 10);
      expect(res.body.message).toContain('registered successfully');
      expect(pool.execute).toHaveBeenCalled();
    });

    it('rejects registration with missing required fields', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com' });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('rejects registration with invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Bad Email',
          email: 'invalid-email',
          password: 'Password123!'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toContain('Invalid email');
    });

    it('rejects registration with duplicate email (ER_DUP_ENTRY)', async () => {
      const dupError = new Error('Duplicate entry');
      dupError.code = 'ER_DUP_ENTRY';
      pool.execute.mockRejectedValueOnce(dupError);

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Duplicate User',
          email: 'existing@example.com',
          password: 'Password123!'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toContain('already be registered');
    });
  });

  describe('POST /api/auth/login', () => {
    it('logs in successfully with valid credentials and returns JWT token', async () => {
      const passwordHash = await bcrypt.hash('CorrectPassword!', 10);
      pool.execute.mockResolvedValueOnce([
        [{ id: 1, name: 'Alice Customer', email: 'customer@example.com', password_hash: passwordHash, role: 'customer' }]
      ]);

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'customer@example.com',
          password: 'CorrectPassword!'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('role', 'customer');
      expect(res.body.user).toHaveProperty('email', 'customer@example.com');
    });

    it('rejects login when password does not match (401)', async () => {
      const passwordHash = await bcrypt.hash('CorrectPassword!', 10);
      pool.execute.mockResolvedValueOnce([
        [{ id: 1, name: 'Alice Customer', email: 'customer@example.com', password_hash: passwordHash, role: 'customer' }]
      ]);

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'customer@example.com',
          password: 'WrongPassword123'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe('Invalid credentials');
    });

    it('rejects login when email is not found in database (401)', async () => {
      pool.execute.mockResolvedValueOnce([[]]);

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password123!'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe('Invalid credentials');
    });
  });
});
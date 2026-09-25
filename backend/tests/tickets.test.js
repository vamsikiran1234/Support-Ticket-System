const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/server');
const pool = require('../src/config/db');

// Mock database pool
jest.mock('../src/config/db', () => ({
  execute: jest.fn()
}));

const JWT_SECRET = process.env.JWT_SECRET || 'support_ticket_secret_key_2026';

// Helper tokens
const customerToken = jwt.sign(
  { id: 1, name: 'Alice Customer', email: 'alice@example.com', role: 'customer' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

const otherCustomerToken = jwt.sign(
  { id: 2, name: 'Bob Customer', email: 'bob@example.com', role: 'customer' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

const agentToken = jwt.sign(
  { id: 99, name: 'Agent Smith', email: 'agent@example.com', role: 'agent' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

describe('Ticket, Comments & Role-Based Access APIs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication & Token Verification (Security)', () => {
    it('rejects access to tickets with 401 when no token is provided', async () => {
      const res = await request(app).get('/api/tickets');
      expect(res.statusCode).toBe(401);
      expect(res.body.error).toContain('No token provided');
    });

    it('rejects access with 401 when token is invalid or tampered', async () => {
      const res = await request(app)
        .get('/api/tickets')
        .set('Authorization', 'Bearer invalid.tampered.token');
      expect(res.statusCode).toBe(401);
      expect(res.body.error).toContain('Invalid or expired token');
    });
  });

  describe('POST /api/tickets - Ticket Creation', () => {
    it('allows a customer to create a ticket with valid data', async () => {
      pool.execute.mockResolvedValueOnce([{ insertId: 42 }]);

      const res = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          subject: 'Payment processing failure',
          description: 'Getting gateway timeout on checkout',
          priority: 'high'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id', 42);
      expect(res.body.message).toContain('Ticket created successfully');
    });

    it('rejects ticket creation if subject is missing (400)', async () => {
      const res = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          description: 'No subject provided'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toContain('Subject is required');
    });
  });

  describe('GET /api/tickets - Listing Tickets', () => {
    it('returns customer tickets when requested by customer', async () => {
      const mockTickets = [
        { id: 1, subject: 'Issue 1', status: 'open', priority: 'medium', customer_name: 'Alice' }
      ];
      pool.execute.mockResolvedValueOnce([mockTickets]);

      const res = await request(app)
        .get('/api/tickets')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].subject).toBe('Issue 1');
    });
  });

  describe('GET /api/tickets/:id - Ownership & Role Authorization', () => {
    it('allows customer to view their own ticket', async () => {
      const ticket = {
        id: 10,
        user_id: 1, // matches customerToken id: 1
        subject: 'My ticket',
        status: 'open',
        priority: 'medium'
      };
      pool.execute.mockResolvedValueOnce([[ticket]]);

      const res = await request(app)
        .get('/api/tickets/10')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.id).toBe(10);
    });

    it('returns 403 Forbidden when a customer attempts to view another customer ticket', async () => {
      const ticket = {
        id: 10,
        user_id: 1, // owned by Alice (id 1)
        subject: 'Confidential issue'
      };
      pool.execute.mockResolvedValueOnce([[ticket]]);

      // Bob (id 2) tries to access Alice's ticket
      const res = await request(app)
        .get('/api/tickets/10')
        .set('Authorization', `Bearer ${otherCustomerToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.error).toBe('Forbidden');
    });

    it('allows an agent to view any customer ticket', async () => {
      const ticket = {
        id: 10,
        user_id: 1,
        subject: 'Customer issue',
        status: 'open'
      };
      pool.execute.mockResolvedValueOnce([[ticket]]);

      const res = await request(app)
        .get('/api/tickets/10')
        .set('Authorization', `Bearer ${agentToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.id).toBe(10);
    });

    it('returns 404 when ticket does not exist', async () => {
      pool.execute.mockResolvedValueOnce([[]]);

      const res = await request(app)
        .get('/api/tickets/9999')
        .set('Authorization', `Bearer ${agentToken}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toContain('Ticket not found');
    });
  });

  describe('PUT /api/tickets/:id - Updating Status and Priority', () => {
    it('allows agent to update ticket status and priority', async () => {
      pool.execute
        .mockResolvedValueOnce([[{ id: 10 }]]) // ticket exists
        .mockResolvedValueOnce([{ affectedRows: 1 }]); // update succeeds

      const res = await request(app)
        .put('/api/tickets/10')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({
          status: 'in_progress',
          priority: 'high'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toContain('Ticket updated');
    });

    it('forbids customer from updating ticket status/priority (403)', async () => {
      const res = await request(app)
        .put('/api/tickets/10')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          status: 'closed'
        });

      expect(res.statusCode).toBe(403);
      expect(res.body.error).toContain('Forbidden');
    });
  });

  describe('GET /api/tickets/stats - Agent KPI Statistics', () => {
    it('returns statistics summary for agents', async () => {
      pool.execute.mockResolvedValueOnce([
        [{ total: 5, open: 2, in_progress: 2, closed: 1, high_priority: 2 }]
      ]);

      const res = await request(app)
        .get('/api/tickets/stats')
        .set('Authorization', `Bearer ${agentToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({
        total: 5,
        open: 2,
        in_progress: 2,
        closed: 1,
        high_priority: 2
      });
    });

    it('forbids customer from viewing agent statistics (403)', async () => {
      const res = await request(app)
        .get('/api/tickets/stats')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.statusCode).toBe(403);
    });
  });

  describe('Comments API', () => {
    it('allows authorized user to post a comment to a ticket', async () => {
      pool.execute
        .mockResolvedValueOnce([[{ id: 10, user_id: 1 }]]) // check ownership
        .mockResolvedValueOnce([{ insertId: 77 }]); // insert comment

      const res = await request(app)
        .post('/api/tickets/10/comments')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ comment: 'Here is more information regarding the error.' });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id', 77);
      expect(res.body.message).toContain('Comment added successfully');
    });

    it('rejects empty comment with 400', async () => {
      const res = await request(app)
        .post('/api/tickets/10/comments')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ comment: '   ' });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toContain('Comment text is required');
    });
  });
});
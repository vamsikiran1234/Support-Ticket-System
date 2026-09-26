const router = require('express').Router();
const pool = require('../config/db');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);

// GET /api/tickets/stats - Agent Dashboard Statistics (Agent-only)
router.get('/stats', requireRole('agent'), async (req, res) => {
  try {
    const [counts] = await pool.execute(`
      SELECT 
        COUNT(*) AS \`total\`,
        COALESCE(SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END), 0) AS \`open\`,
        COALESCE(SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END), 0) AS \`in_progress\`,
        COALESCE(SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END), 0) AS \`closed\`,
        COALESCE(SUM(CASE WHEN priority = 'high' AND status != 'closed' THEN 1 ELSE 0 END), 0) AS \`high_priority\`
      FROM tickets
    `);

    res.json({
      total: Number(counts[0].total || 0),
      open: Number(counts[0].open || 0),
      in_progress: Number(counts[0].in_progress || 0),
      closed: Number(counts[0].closed || 0),
      high_priority: Number(counts[0].high_priority || 0)
    });
  } catch (err) {
    console.error('Error fetching ticket statistics:', err);
    res.status(500).json({ error: 'Failed to retrieve ticket statistics: ' + (err.sqlMessage || err.message) });
  }
});

// POST /api/tickets - Create a new support ticket
router.post('/', async (req, res) => {
  try {
    const { subject, description, priority = 'medium' } = req.body;

    if (!subject || subject.trim() === '') {
      return res.status(400).json({ error: 'Subject is required' });
    }

    const validPriorities = ['low', 'medium', 'high'];
    const chosenPriority = validPriorities.includes(priority) ? priority : 'medium';

    const [result] = await pool.execute(
      'INSERT INTO tickets (user_id, subject, description, priority, status) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, subject.trim(), description ? description.trim() : null, chosenPriority, 'open']
    );

    res.status(201).json({
      message: 'Ticket created successfully',
      id: result.insertId
    });
  } catch (err) {
    console.error('Error creating ticket:', err);
    if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_NO_REFERENCED_ROW') {
      return res.status(401).json({ error: 'User session invalid or user not found. Please log out and sign in again.' });
    }
    res.status(500).json({ error: 'Failed to create ticket: ' + (err.sqlMessage || err.message) });
  }
});

// GET /api/tickets - Retrieve tickets (role-filtered, searchable, filterable, and paginated)
router.get('/', async (req, res) => {
  try {
    const isAgent = req.user.role === 'agent';
    const { status, priority, search, sort, page, limit, paginated } = req.query;

    let baseFilterSql = ' WHERE 1=1';
    const filterParams = [];

    // Customers only see their own tickets
    if (!isAgent) {
      baseFilterSql += ' AND tickets.user_id = ?';
      filterParams.push(req.user.id);
    }

    if (status) {
      baseFilterSql += ' AND tickets.status = ?';
      filterParams.push(status);
    }

    if (priority) {
      baseFilterSql += ' AND tickets.priority = ?';
      filterParams.push(priority);
    }

    if (search) {
      baseFilterSql += ' AND (tickets.subject LIKE ? OR tickets.description LIKE ?)';
      filterParams.push(`%${search}%`, `%${search}%`);
    }

    const isPaginationRequested = paginated === 'true' || (page !== undefined && limit !== undefined);

    let sql = `
      SELECT 
        tickets.id,
        tickets.subject,
        tickets.description,
        tickets.priority,
        tickets.status,
        tickets.assigned_to,
        tickets.created_at,
        tickets.updated_at,
        users.id AS customer_id,
        users.name AS customer_name,
        users.email AS customer_email,
        agents.name AS assigned_agent_name
      FROM tickets
      JOIN users ON tickets.user_id = users.id
      LEFT JOIN users AS agents ON tickets.assigned_to = agents.id
      ${baseFilterSql}
    `;
    const params = [...filterParams];

    // Sorting
    if (sort === 'oldest') {
      sql += ' ORDER BY tickets.created_at ASC';
    } else if (sort === 'priority') {
      sql += " ORDER BY FIELD(tickets.priority, 'high', 'medium', 'low'), tickets.created_at DESC";
    } else {
      sql += ' ORDER BY tickets.created_at DESC';
    }

    // Pagination calculations
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const offsetNum = (pageNum - 1) * limitNum;

    if (isPaginationRequested) {
      const countSql = `SELECT COUNT(*) AS total FROM tickets ${baseFilterSql}`;
      const [countRows] = await pool.execute(countSql, filterParams);
      const totalCount = Number(countRows[0]?.total || 0);

      sql += ` LIMIT ${limitNum} OFFSET ${offsetNum}`;
      const [rows] = await pool.execute(sql, params);

      return res.json({
        tickets: rows,
        pagination: {
          total: totalCount,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(totalCount / limitNum) || 1
        }
      });
    }

    const [rows] = await pool.execute(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching tickets:', err);
    res.status(500).json({ error: 'Failed to fetch tickets: ' + (err.sqlMessage || err.message) });
  }
});

// GET /api/tickets/:id - Get single ticket details with strict ownership verification
router.get('/:id', async (req, res) => {
  try {
    const ticketId = req.params.id;

    const [rows] = await pool.execute(`
      SELECT 
        tickets.id,
        tickets.user_id,
        tickets.subject,
        tickets.description,
        tickets.priority,
        tickets.status,
        tickets.assigned_to,
        tickets.created_at,
        tickets.updated_at,
        users.name AS customer_name,
        users.email AS customer_email,
        agents.name AS assigned_agent_name
      FROM tickets
      JOIN users ON tickets.user_id = users.id
      LEFT JOIN users AS agents ON tickets.assigned_to = agents.id
      WHERE tickets.id = ?
    `, [ticketId]);

    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const ticket = rows[0];

    // Ownership check: non-agents cannot access other customers' tickets
    if (req.user.role !== 'agent' && ticket.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    res.json(ticket);
  } catch (err) {
    console.error('Error fetching ticket details:', err);
    res.status(500).json({ error: 'Failed to fetch ticket details: ' + (err.sqlMessage || err.message) });
  }
});

// PUT /api/tickets/:id - Update status, priority, or assigned agent (Agent-only)
router.put('/:id', requireRole('agent'), async (req, res) => {
  try {
    const ticketId = req.params.id;
    const { status, priority, assigned_to } = req.body;

    const [existing] = await pool.execute('SELECT * FROM tickets WHERE id = ?', [ticketId]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const updates = [];
    const params = [];

    if (status) {
      const validStatuses = ['open', 'in_progress', 'closed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status value' });
      }
      updates.push('status = ?');
      params.push(status);
    }

    if (priority) {
      const validPriorities = ['low', 'medium', 'high'];
      if (!validPriorities.includes(priority)) {
        return res.status(400).json({ error: 'Invalid priority value' });
      }
      updates.push('priority = ?');
      params.push(priority);
    }

    if (assigned_to !== undefined) {
      updates.push('assigned_to = ?');
      params.push(assigned_to === null || assigned_to === '' ? null : assigned_to);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid update fields provided' });
    }

    params.push(ticketId);
    await pool.execute(`UPDATE tickets SET ${updates.join(', ')} WHERE id = ?`, params);

    res.json({ message: 'Ticket updated' });
  } catch (err) {
    console.error('Error updating ticket:', err);
    res.status(500).json({ error: 'Failed to update ticket: ' + (err.sqlMessage || err.message) });
  }
});

// DELETE /api/tickets/:id - Delete ticket
router.delete('/:id', async (req, res) => {
  try {
    const ticketId = req.params.id;

    const [rows] = await pool.execute('SELECT * FROM tickets WHERE id = ?', [ticketId]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const ticket = rows[0];

    // Only agents or the ticket creator can delete
    if (req.user.role !== 'agent' && ticket.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await pool.execute('DELETE FROM tickets WHERE id = ?', [ticketId]);
    res.json({ message: 'Ticket deleted successfully' });
  } catch (err) {
    console.error('Error deleting ticket:', err);
    res.status(500).json({ error: 'Failed to delete ticket: ' + (err.sqlMessage || err.message) });
  }
});

// GET /api/tickets/:id/comments - Retrieve comments for an authorized ticket
router.get('/:id/comments', async (req, res) => {
  try {
    const ticketId = req.params.id;

    const [ticketRows] = await pool.execute('SELECT id, user_id FROM tickets WHERE id = ?', [ticketId]);
    if (!ticketRows || ticketRows.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const ticket = ticketRows[0];
    if (req.user.role !== 'agent' && ticket.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const [comments] = await pool.execute(`
      SELECT 
        ticket_comments.id,
        ticket_comments.ticket_id,
        ticket_comments.user_id,
        ticket_comments.comment,
        ticket_comments.created_at,
        users.name AS user_name,
        users.role AS user_role
      FROM ticket_comments
      JOIN users ON ticket_comments.user_id = users.id
      WHERE ticket_comments.ticket_id = ?
      ORDER BY ticket_comments.created_at ASC
    `, [ticketId]);

    res.json(comments);
  } catch (err) {
    console.error('Error fetching comments:', err);
    res.status(500).json({ error: 'Failed to fetch comments: ' + (err.sqlMessage || err.message) });
  }
});

// POST /api/tickets/:id/comments - Add a response/comment
router.post('/:id/comments', async (req, res) => {
  try {
    const ticketId = req.params.id;
    const { comment } = req.body;

    if (!comment || comment.trim() === '') {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    const [ticketRows] = await pool.execute('SELECT id, user_id FROM tickets WHERE id = ?', [ticketId]);
    if (!ticketRows || ticketRows.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const ticket = ticketRows[0];
    if (req.user.role !== 'agent' && ticket.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const [result] = await pool.execute(
      'INSERT INTO ticket_comments (ticket_id, user_id, comment) VALUES (?, ?, ?)',
      [ticketId, req.user.id, comment.trim()]
    );

    res.status(201).json({
      message: 'Comment added successfully',
      id: result.insertId
    });
  } catch (err) {
    console.error('Error posting comment:', err);
    res.status(500).json({ error: 'Failed to post comment: ' + (err.sqlMessage || err.message) });
  }
});

module.exports = router;
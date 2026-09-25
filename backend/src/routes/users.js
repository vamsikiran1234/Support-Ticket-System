const router = require('express').Router();
const pool = require('../config/db');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);

// GET /api/users - Retrieve users/agents for assignment (Agent-only)
router.get('/', requireRole('agent'), async (req, res) => {
  try {
    const roleFilter = req.query.role;
    let sql = 'SELECT id, name, email, role, created_at FROM users';
    const params = [];

    if (roleFilter) {
      sql += ' WHERE role = ?';
      params.push(roleFilter);
    } else {
      sql += ' ORDER BY role ASC, name ASC';
    }

    const [rows] = await pool.execute(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

module.exports = router;

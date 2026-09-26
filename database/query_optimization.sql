-- ==============================================================================
-- Support Ticket Management System
-- Optional Enhancement: Advanced Database Indexing & Query Optimization
-- ==============================================================================
-- This script demonstrates index optimization strategies, covering indexes,
-- full-text search indexing, and EXPLAIN execution plan diagnostics to ensure
-- high-throughput query performance under production-scale loads.
-- ==============================================================================

USE support_tickets;

-- ------------------------------------------------------------------------------
-- 1. Composite & Covering Indexes for High-Frequency Filtering & Sorting
-- ------------------------------------------------------------------------------

-- Problem: Customer dashboard queries filter by user_id, optionally by status,
-- and order by created_at DESC with pagination (LIMIT/OFFSET).
-- A single-column index on user_id forces MySQL to perform a filesort.
-- Solution: Composite index on (user_id, status, created_at DESC)
-- This allows MySQL to satisfy the WHERE filter AND the ORDER BY directly from index.
ALTER TABLE tickets 
ADD INDEX idx_user_status_created (user_id, status, created_at DESC);

-- Problem: Agent dashboard queries filter by status and priority concurrently,
-- and order by created_at DESC.
-- Solution: Composite index on (status, priority, created_at DESC)
ALTER TABLE tickets 
ADD INDEX idx_status_priority_created (status, priority, created_at DESC);

-- Problem: Workload filtering by assigned agent and status
-- Solution: Composite index on (assigned_to, status)
ALTER TABLE tickets 
ADD INDEX idx_assigned_status (assigned_to, status);

-- Problem: Comment threads are queried by ticket_id and ordered by created_at ASC.
-- Solution: Composite index on (ticket_id, created_at ASC)
ALTER TABLE ticket_comments 
ADD INDEX idx_ticket_comments_order (ticket_id, created_at ASC);

-- ------------------------------------------------------------------------------
-- 2. Full-Text Search Indexing for Fast Keyword Lookup
-- ------------------------------------------------------------------------------

-- Problem: `LIKE '%keyword%'` queries cannot use standard B-Tree indexes,
-- resulting in full table scans (O(N) time complexity).
-- Solution: MySQL FULLTEXT index on subject and description.
ALTER TABLE tickets 
ADD FULLTEXT INDEX ft_subject_description (subject, description);

-- ------------------------------------------------------------------------------
-- 3. Execution Plan Diagnostics (EXPLAIN / EXPLAIN ANALYZE)
-- ------------------------------------------------------------------------------

-- Query A: Customer Dashboard Filtered List
-- Without composite index: Extra = 'Using filesort'
-- With composite index idx_user_status_created:
-- Key = idx_user_status_created, Ref = const,const, Extra = Using index condition
EXPLAIN SELECT 
    tickets.id, tickets.subject, tickets.status, tickets.priority, tickets.created_at
FROM tickets
WHERE tickets.user_id = 1 AND tickets.status = 'open'
ORDER BY tickets.created_at DESC
LIMIT 10 OFFSET 0;

-- Query B: Agent Dashboard Multi-Criteria Filter
-- Key = idx_status_priority_created
EXPLAIN SELECT 
    tickets.id, tickets.subject, tickets.status, tickets.priority, tickets.created_at
FROM tickets
WHERE tickets.status = 'open' AND tickets.priority = 'high'
ORDER BY tickets.created_at DESC
LIMIT 10 OFFSET 0;

-- Query C: Fulltext Search vs LIKE Scan
-- Fast fulltext search query:
EXPLAIN SELECT 
    id, subject, status, priority, MATCH(subject, description) AGAINST('login error' IN NATURAL LANGUAGE MODE) AS score
FROM tickets
WHERE MATCH(subject, description) AGAINST('login error' IN NATURAL LANGUAGE MODE)
ORDER BY score DESC;

-- Query D: Ticket Comment Thread Retrieval
-- Key = idx_ticket_comments_order, avoiding temporary table and filesort
EXPLAIN SELECT 
    ticket_comments.id, ticket_comments.comment, ticket_comments.created_at, users.name
FROM ticket_comments
JOIN users ON ticket_comments.user_id = users.id
WHERE ticket_comments.ticket_id = 1
ORDER BY ticket_comments.created_at ASC;

-- ------------------------------------------------------------------------------
-- 4. KPI Aggregate Statistics Optimization
-- ------------------------------------------------------------------------------
-- The statistics query calculates aggregate counts across all ticket statuses.
-- Using idx_status allows an index-only scan (Using index) without row lookups.
EXPLAIN SELECT 
  COUNT(*) AS total,
  COALESCE(SUM(status = 'open'), 0) AS `open`,
  COALESCE(SUM(status = 'in_progress'), 0) AS in_progress,
  COALESCE(SUM(status = 'closed'), 0) AS closed,
  COALESCE(SUM(priority = 'high'), 0) AS high_priority
FROM tickets;

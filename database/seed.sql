-- Support Ticket Management System
-- Initial Seed Data Script
-- Default password for all seed accounts is: Password123!

USE support_tickets;

-- Clean existing data
DELETE FROM ticket_comments;
DELETE FROM tickets;
DELETE FROM users;

-- 1. Insert Seed Users (bcrypt hash for Password123!)
INSERT INTO users (id, name, email, password_hash, role) VALUES
(1, 'Alice Johnson', 'customer@example.com', '$2b$10$/e9az0fI02PsGZW19vfLLOeaGuELqe..8/dN.dVZUvMWTHg/WXRXO', 'customer'),
(2, 'Bob Agent', 'agent@example.com', '$2b$10$/e9az0fI02PsGZW19vfLLOeaGuELqe..8/dN.dVZUvMWTHg/WXRXO', 'agent'),
(3, 'Sarah Support', 'agent2@example.com', '$2b$10$/e9az0fI02PsGZW19vfLLOeaGuELqe..8/dN.dVZUvMWTHg/WXRXO', 'agent'),
(4, 'John Doe', 'john@example.com', '$2b$10$/e9az0fI02PsGZW19vfLLOeaGuELqe..8/dN.dVZUvMWTHg/WXRXO', 'customer');

-- 2. Insert Seed Tickets
INSERT INTO tickets (id, user_id, subject, description, priority, status, assigned_to, created_at) VALUES
(1, 1, 'Cannot access billing dashboard', 'Whenever I click on the billing tab in the portal, it displays a 500 error screen.', 'high', 'open', NULL, DATE_SUB(NOW(), INTERVAL 2 DAY)),
(2, 1, 'Inquiry regarding API rate limits', 'Could you clarify the request per minute threshold for the basic tier?', 'medium', 'in_progress', 2, DATE_SUB(NOW(), INTERVAL 1 DAY)),
(3, 4, 'Update company billing address', 'We recently moved offices and need to update our invoice address to 123 Tech Park.', 'low', 'closed', 2, DATE_SUB(NOW(), INTERVAL 3 DAY));

-- 3. Insert Seed Comments
INSERT INTO ticket_comments (id, ticket_id, user_id, comment, created_at) VALUES
(1, 2, 2, 'Hello Alice, our standard rate limit on the basic tier is 60 requests per minute.', DATE_SUB(NOW(), INTERVAL 12 HOUR)),
(2, 2, 1, 'Thank you Bob! Does this limit apply across all endpoints or per endpoint?', DATE_SUB(NOW(), INTERVAL 6 HOUR));

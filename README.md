# Support Ticket Management System

[![Node.js](https://img.shields.io/badge/Node.js-v20%2B-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-v18-blue.svg)](https://react.dev/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-orange.svg)](https://www.mysql.com/)
[![Tests](https://img.shields.io/badge/Tests-Jest%20%26%20Supertest%20(22%20passing)-brightgreen.svg)]()
[![License](https://img.shields.io/badge/License-MIT-purple.svg)]()

A full-stack, enterprise-grade **Support Ticket Management System** built with **React.js**, **Node.js (Express)**, and **MySQL**. Provides role-based portals for **Customers** (to raise, track, and converse on support requests) and **Support Agents** (to monitor KPIs, triage queues, update statuses, assign tickets, and resolve issues).

---

## 🚀 Live Demo & Deployment URLs

- **Public Frontend Portal:** `https://support-ticket-system-demo.vercel.app` *(or your deployed Vercel/Netlify URL)*
- **Public Backend API:** `https://support-ticket-api.onrender.com` *(or your deployed Render/Railway URL)*
- **GitHub Repository:** [https://github.com/vamsikiran1234/Support-Ticket-System.git](https://github.com/vamsikiran1234/Support-Ticket-System.git)

---

## 🎯 Features & Capabilities

### 👤 Customer Portal
- **Customer Registration & JWT Authentication:** Secure registration and login with bcrypt-hashed passwords.
- **Self-Service Dashboard:** Visual metrics of submitted tickets (Total, Open, In Progress, Closed).
- **Ticket Creation:** Submit new tickets with subjects, descriptions, and priority levels (`low`, `medium`, `high`).
- **Interactive Ticket Thread:** Real-time conversation thread with support agents.
- **Search & Filtering:** Instant keyword search and status/priority filters.
- **Strict Data Isolation:** Customers can only view and interact with their own tickets.

### 🛡️ Support Agent Desk
- **KPI Metrics Dashboard:** Real-time counter widgets for Total Tickets, Open/Unresolved, In Progress, Closed, and Urgent High-Priority Tickets.
- **Omnichannel Queue Management:** Comprehensive table view of all customer tickets across the organization.
- **Lifecycle Management:** Update ticket status (`open` ➔ `in_progress` ➔ `closed`) and priority (`low`, `medium`, `high`).
- **Agent Assignment:** Assign and reassign tickets to specific support agents.
- **Customer Communication:** Post agent responses directly into the ticket activity stream.
- **Multi-parameter Sorting & Filtering:** Sort by Newest, Oldest, or Priority.

---

## 🏗️ Project Architecture & Structure

```
Support_Ticket_System/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js               # MySQL2 connection pool with parameterized execution
│   │   ├── middleware/
│   │   │   └── auth.js             # Authentication (JWT) and Role Authorization (RBAC)
│   │   ├── routes/
│   │   │   ├── auth.js             # Customer registration & customer/agent login
│   │   │   ├── tickets.js          # CRUD operations, comments, stats, and filters
│   │   │   └── users.js            # Agent directory for ticket assignment
│   │   └── server.js               # Express application entrypoint with CORS & routes
│   ├── tests/
│   │   ├── auth.test.js            # 8 unit/integration tests for authentication & hashing
│   │   └── tickets.test.js         # 14 unit/integration tests for tickets, RBAC & comments
│   ├── .env.example                # Backend environment variable template
│   ├── Dockerfile                  # Production container definition for backend
│   └── package.json
├── frontend/
│   ├── public/
│   │   └── index.html              # HTML shell with Google Fonts & responsive viewport
│   ├── src/
│   │   ├── api/
│   │   │   └── client.js           # Axios instance with auto JWT interceptor & 401 handling
│   │   ├── components/
│   │   │   ├── Navbar.js           # Responsive navigation bar with role badge & logout
│   │   │   ├── ProtectedRoute.js   # Route guard enforcing authentication & role permissions
│   │   │   └── StatusBadge.js      # Color-coded badges for ticket status and priority
│   │   ├── context/
│   │   │   └── AuthContext.js      # Global authentication state, session storage & login/logout
│   │   ├── pages/
│   │   │   ├── Login.js            # Login view with 1-click seed demo accounts
│   │   │   ├── Register.js         # Customer registration form with client validation
│   │   │   ├── CustomerDashboard.js# Customer tickets view, metrics & search
│   │   │   ├── CreateTicket.js     # Ticket creation form with validation
│   │   │   ├── AgentDashboard.js   # Agent operations center with KPI stats & queue
│   │   │   └── TicketDetail.js     # Ticket details, agent controls & conversation stream
│   │   ├── App.js                  # React Router 6 configuration
│   │   ├── index.css               # Bespoke, responsive design system
│   │   └── index.js
│   ├── .env.example                # Frontend environment template
│   ├── Dockerfile                  # Multi-stage production build container with Nginx
│   └── package.json
├── database/
│   ├── schema.sql                  # Database DDL with tables, foreign keys, and indexes
│   └── seed.sql                    # Realistic test data, users, tickets & comments
├── postman_collection.json         # Postman Collection v2.1 covering all endpoints
├── docker-compose.yml              # Complete 1-click Docker orchestration
├── .gitignore                      # Enforces isolation of secrets and node_modules
└── README.md                       # Comprehensive system documentation
```

---

## 🗄️ Database Design & Schema

The relational database uses **MySQL 8.0** with strict referential integrity, foreign key cascades, and indexing for fast query performance.

### Entity Relationship Model

1. **`users` Table:**
   - Stores both Customers and Support Agents, distinguished by the `role` enum.
   - Primary key: `id` (Auto Increment).
   - `email`: `VARCHAR(100)` with `UNIQUE` constraint.
   - `password_hash`: `VARCHAR(255)` storing one-way bcrypt hashes.
   - `role`: `ENUM('customer', 'agent') NOT NULL`.

2. **`tickets` Table:**
   - Stores support tickets created by customers.
   - Primary key: `id` (Auto Increment).
   - `user_id`: Foreign key referencing `users(id)` (`ON DELETE CASCADE`).
   - `assigned_to`: Foreign key referencing `users(id)` (`ON DELETE SET NULL`).
   - `priority`: `ENUM('low', 'medium', 'high') DEFAULT 'medium'`.
   - `status`: `ENUM('open', 'in_progress', 'closed') DEFAULT 'open'`.
   - **Indexes:** `idx_status` (accelerates queue status filters), `idx_user_id`, `idx_assigned_to`.

3. **`ticket_comments` Table:**
   - Stores threaded conversation responses on a ticket.
   - Primary key: `id` (Auto Increment).
   - `ticket_id`: Foreign key referencing `tickets(id)` (`ON DELETE CASCADE`).
   - `user_id`: Foreign key referencing `users(id)` (`ON DELETE CASCADE`).
   - `comment`: `TEXT NOT NULL`.

---

## 🔍 Example Database Query Requirement

As specified in **Section 8** of the technical assessment brief, below is the SQL query returning all **open tickets** along with the customer's name and email, demonstrating an `INNER JOIN` and filtering:

```sql
SELECT 
    tickets.id,
    tickets.subject,
    tickets.status,
    tickets.priority,
    tickets.created_at,
    users.name AS customer_name,
    users.email AS customer_email
FROM tickets
JOIN users ON tickets.user_id = users.id
WHERE tickets.status = 'open'
ORDER BY tickets.created_at DESC;
```

### Explanation of Query Mechanics & Performance:
- **`JOIN users ON tickets.user_id = users.id`:** Combines the relational records by matching the customer's foreign key `user_id` to `users.id`, pulling the author's identity without storing duplicate user data inside `tickets`.
- **`WHERE tickets.status = 'open'`:** Filters the dataset to only include unresolved tickets.
- **Index Optimization:** The query utilizes the `INDEX idx_status (status)` defined in `schema.sql`, allowing MySQL to perform an index range scan rather than an expensive full table scan.

---

## 🔐 Security Architecture

- **Password Hashing:** Passwords are never stored in plain text. Passwords are salted and hashed using `bcrypt` with cost factor 10.
- **JWT Authentication:** Stateful sessions are avoided. Incoming requests carry a cryptographically signed JSON Web Token in the `Authorization: Bearer <token>` header.
- **Role-Based Access Control (RBAC):** Authentication (verifying identity) is decoupled from Authorization (verifying permissions). Agent-only endpoints (e.g., stats, updates, user listing) are guarded by `requireRole('agent')`.
- **Ownership Verification:** A customer cannot view or modify another customer's ticket. `GET /api/tickets/:id` explicitly checks:
  ```javascript
  if (req.user.role !== 'agent' && ticket.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  ```
- **SQL Injection Prevention:** All SQL statements strictly use parameterized queries (`pool.execute(sql, [params])` with `?` placeholders).
- **Environment Isolation:** Secrets (`JWT_SECRET`, database credentials) are stored exclusively in `.env` files which are excluded via `.gitignore`. A `.env.example` file is provided for deployment.
- **Cross-Origin Resource Sharing (CORS):** Explicitly enabled in Express to safely permit requests from the React frontend.

---

## 💻 Local Setup & Installation

### Option A: Using Docker Compose (Recommended)

Run the entire system (MySQL 8, Express backend, React frontend) with a single command:

```bash
docker compose up --build
```
- Frontend will be accessible at: `http://localhost:3000`
- Backend API will be accessible at: `http://localhost:5000`
- MySQL database will be initialized automatically with `database/schema.sql` and `database/seed.sql`.

---

### Option B: Manual Local Setup

#### 1. Prerequisites
- **Node.js** (v18 or higher): `node -v`
- **npm** (v9 or higher): `npm -v`
- **MySQL Server** (v8.0+): Local install or free cloud instance on [Railway](https://railway.app/) / [Aiven](https://aiven.io/).

#### 2. Database Setup
Log into your MySQL console or GUI tool (MySQL Workbench / TablePlus):
```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql
```

#### 3. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
```
Edit `backend/.env` with your database credentials:
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=support_tickets
DB_PORT=3306
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=1d
```
Start the backend server:
```bash
npm run dev
# Server will run on http://localhost:5000
```

#### 4. Frontend Setup
In a new terminal window:
```bash
cd frontend
npm install
npm start
# React app will open on http://localhost:3000
```

---

## 🧪 Automated Testing (Jest & Supertest)

The repository includes a comprehensive automated test suite covering positive flows, negative validation, role-based boundary testing, and token security:

```bash
cd backend
npm test
```

### Test Coverage Summary (22 Tests Passing):
1. **Registration:**
   - Valid customer registration (201)
   - Missing required fields validation (400)
   - Invalid email format validation (400)
   - Duplicate email constraint handling (400)
2. **Authentication:**
   - Valid credentials login returning JWT token (200)
   - Invalid password rejection (401)
   - Non-existent user rejection (401)
3. **Security & Authorization:**
   - Missing token rejection (401)
   - Tampered / expired token rejection (401)
   - Customer prohibited from viewing another customer's ticket (403 Forbidden)
   - Customer prohibited from updating ticket status (403 Forbidden)
   - Customer prohibited from accessing agent stats (403 Forbidden)
4. **Ticket Lifecycle:**
   - Customer ticket creation (201)
   - Missing subject validation (400)
   - Customer viewing own ticket (200)
   - Agent viewing any ticket (200)
   - Non-existent ticket ID handling (404)
   - Agent updating status and priority (200)
   - Agent viewing metrics statistics (200)
5. **Comments:**
   - Posting comment to authorized ticket (201)
   - Empty comment validation (400)

---

## 📬 Postman Collection

The file `postman_collection.json` in the root of the repository is exported in **Postman Collection v2.1** format.

### How to Import & Use:
1. Open **Postman**.
2. Click **Import** (top left) and select `postman_collection.json`.
3. The collection includes pre-configured collection variables:
   - `baseUrl`: `http://localhost:5000/api`
   - `customerToken`: Auto-populated upon running "Customer Login".
   - `agentToken`: Auto-populated upon running "Agent Login".
   - `createdTicketId`: Auto-populated upon running "Create Ticket".
4. Run requests in sequence to test authentication, ticket lifecycle, comments, role restrictions (403), unauthorized requests (401), and error handling (400/404).

---

## 🔑 Seed User Accounts

For immediate testing, the database seed contains the following pre-configured accounts:

| Role | Email | Password | Purpose |
| :--- | :--- | :--- | :--- |
| **Customer** | `customer@example.com` | `Password123!` | Standard customer account with existing sample tickets |
| **Customer** | `john@example.com` | `Password123!` | Secondary customer account to test cross-customer 403 checks |
| **Support Agent** | `agent@example.com` | `Password123!` | Primary support agent with full queue management & triage permissions |
| **Support Agent** | `agent2@example.com` | `Password123!` | Secondary support agent for ticket assignment testing |

*(Note: The login page in the web app also provides 1-click demo buttons to sign in as either role instantly.)*

---

## ☁️ Cloud Deployment Guide

### 1. Database Deployment (Railway / Aiven)
1. Provision a free MySQL database on [Railway](https://railway.app/) or [Aiven](https://aiven.io/).
2. Connect to the instance using MySQL Workbench or CLI and run `database/schema.sql` followed by `database/seed.sql`.
3. Copy the host, port, username, password, and database name.

### 2. Backend Deployment (Render / Railway)
1. Link your GitHub repository and select the `backend/` directory as the root.
2. Build command: `npm install`
3. Start command: `npm start`
4. Set the following Environment Variables in the platform dashboard:
   - `DB_HOST`: Your cloud database host
   - `DB_USER`: Your cloud database user
   - `DB_PASSWORD`: Your cloud database password
   - `DB_NAME`: `support_tickets`
   - `DB_PORT`: Database port (e.g., `3306`)
   - `JWT_SECRET`: A long random secret key
   - `JWT_EXPIRES_IN`: `1d`

### 3. Frontend Deployment (Vercel / Netlify)
1. Link your GitHub repository and select the `frontend/` directory as the project root.
2. Build command: `npm run build`
3. Output directory: `build`
4. Set the Environment Variable:
   - `REACT_APP_API_URL`: `https://your-backend-api.onrender.com/api`

---

## 📄 License
This project is submitted as part of the Junior Full Stack Developer Technical Assessment. Licensed under the MIT License.
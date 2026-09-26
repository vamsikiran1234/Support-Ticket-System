import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { StatusBadge, PriorityBadge } from '../components/StatusBadge';
import { 
  Shield, Search, Filter, RefreshCw, ArrowRight, UserCheck, 
  AlertTriangle, CheckCircle2, Clock, Inbox, Calendar, User,
  ChevronLeft, ChevronRight
} from 'lucide-react';

const AgentDashboard = () => {
  const [stats, setStats] = useState({ total: 0, open: 0, in_progress: 0, closed: 0, high_priority: 0 });
  const [tickets, setTickets] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      const [statsRes, ticketsRes, agentsRes] = await Promise.all([
        api.get('/tickets/stats'),
        api.get('/tickets', {
          params: {
            status: statusFilter || undefined,
            priority: priorityFilter || undefined,
            search: search.trim() || undefined,
            sort: sortBy,
            page,
            limit: 10,
            paginated: 'true'
          }
        }),
        api.get('/users?role=agent')
      ]);

      setStats(statsRes.data);
      if (ticketsRes.data.tickets) {
        setTickets(ticketsRes.data.tickets);
        setPagination(ticketsRes.data.pagination);
      } else {
        setTickets(ticketsRes.data);
      }
      setAgents(agentsRes.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load support dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter, priorityFilter, sortBy, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchData();
  };

  const handleQuickAssign = async (ticketId, agentId) => {
    try {
      await api.put(`/tickets/${ticketId}`, { assigned_to: agentId ? Number(agentId) : null });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update ticket assignment');
    }
  };

  const handleQuickStatus = async (ticketId, newStatus) => {
    try {
      await api.put(`/tickets/${ticketId}`, { status: newStatus });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update ticket status');
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <div className="agent-badge-header">
            <Shield size={18} />
            <span>Agent Operations Center</span>
          </div>
          <h1 className="page-title">Support Ticket Management</h1>
          <p className="page-subtitle">Monitor incoming queues, manage ticket lifecycle, and triage customer inquiries</p>
        </div>
        <button onClick={fetchData} className="btn btn-secondary">
          <RefreshCw size={16} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* KPI Stats Widgets */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrap icon-total">
            <Inbox size={22} />
          </div>
          <div>
            <span className="stat-label">Total Tickets</span>
            <span className="stat-value">{stats.total}</span>
          </div>
        </div>

        <div className="stat-card stat-card-open">
          <div className="stat-icon-wrap icon-open">
            <Clock size={22} />
          </div>
          <div>
            <span className="stat-label">Open / Unresolved</span>
            <span className="stat-value">{stats.open}</span>
          </div>
        </div>

        <div className="stat-card stat-card-progress">
          <div className="stat-icon-wrap icon-progress">
            <UserCheck size={22} />
          </div>
          <div>
            <span className="stat-label">In Progress</span>
            <span className="stat-value">{stats.in_progress}</span>
          </div>
        </div>

        <div className="stat-card stat-card-closed">
          <div className="stat-icon-wrap icon-closed">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <span className="stat-label">Closed</span>
            <span className="stat-value">{stats.closed}</span>
          </div>
        </div>

        <div className="stat-card stat-card-urgent">
          <div className="stat-icon-wrap icon-urgent">
            <AlertTriangle size={22} />
          </div>
          <div>
            <span className="stat-label">High Priority Active</span>
            <span className="stat-value">{stats.high_priority}</span>
          </div>
        </div>
      </div>

      {/* Filters & Search Control Bar */}
      <div className="filter-bar">
        <form onSubmit={handleSearchSubmit} className="search-form">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search tickets by subject, description or customer name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="btn btn-secondary">Filter</button>
        </form>

        <div className="filter-controls">
          <div className="filter-select-wrapper">
            <Filter size={16} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="select-control"
            >
              <option value="">All Statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div className="filter-select-wrapper">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="select-control"
            >
              <option value="">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="filter-select-wrapper">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="select-control"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="oldest">Sort: Oldest First</option>
              <option value="priority">Sort: By Priority</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      )}

      {/* Agent Master Tickets Table */}
      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading ticket queue...</p>
        </div>
      ) : tickets.length === 0 ? (
        <div className="empty-state">
          <Inbox size={48} className="empty-icon" />
          <h3>No tickets found</h3>
          <p>No customer tickets matched the filter criteria.</p>
        </div>
      ) : (
        <div className="table-card">
          <table className="tickets-table agent-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Subject & Customer</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Assigned Agent</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => (
                <tr key={ticket.id}>
                  <td className="ticket-id">#{ticket.id}</td>
                  <td className="ticket-subject">
                    <Link to={`/tickets/${ticket.id}`} className="subject-link">
                      {ticket.subject}
                    </Link>
                    <div className="customer-info-line">
                      <User size={13} />
                      <span>{ticket.customer_name} ({ticket.customer_email})</span>
                    </div>
                  </td>
                  <td>
                    <PriorityBadge priority={ticket.priority} />
                  </td>
                  <td>
                    <select
                      value={ticket.status}
                      onChange={(e) => handleQuickStatus(ticket.id, e.target.value)}
                      className="table-inline-select"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="closed">Closed</option>
                    </select>
                  </td>
                  <td>
                    <select
                      value={ticket.assigned_to || ''}
                      onChange={(e) => handleQuickAssign(ticket.id, e.target.value)}
                      className="table-inline-select"
                    >
                      <option value="">Unassigned</option>
                      {agents.map((ag) => (
                        <option key={ag.id} value={ag.id}>
                          {ag.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="date-cell">
                    <div className="date-wrapper">
                      <Calendar size={13} />
                      <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td>
                    <Link to={`/tickets/${ticket.id}`} className="btn btn-sm btn-outline">
                      <span>Details</span>
                      <ArrowRight size={14} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {pagination.totalPages > 1 && (
            <div className="pagination-bar">
              <div className="pagination-info">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} tickets
              </div>
              <div className="pagination-controls">
                <button
                  className="pagination-btn"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={pagination.page <= 1}
                >
                  <ChevronLeft size={16} />
                  <span>Previous</span>
                </button>
                <span className="pagination-pages">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  className="pagination-btn"
                  onClick={() => setPage((prev) => Math.min(pagination.totalPages, prev + 1))}
                  disabled={pagination.page >= pagination.totalPages}
                >
                  <span>Next</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AgentDashboard;

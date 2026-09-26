import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { StatusBadge, PriorityBadge } from '../components/StatusBadge';
import { PlusCircle, Search, Filter, MessageSquare, AlertCircle, RefreshCw, Calendar, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

const CustomerDashboard = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {
        page,
        limit: 10,
        paginated: 'true'
      };
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      if (search.trim()) params.search = search.trim();

      const res = await api.get('/tickets', { params });
      if (res.data.tickets) {
        setTickets(res.data.tickets);
        setPagination(res.data.pagination);
      } else {
        setTickets(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch your tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [statusFilter, priorityFilter, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchTickets();
  };

  // Quick stats calculations
  const totalCount = tickets.length;
  const openCount = tickets.filter(t => t.status === 'open').length;
  const progressCount = tickets.filter(t => t.status === 'in_progress').length;
  const closedCount = tickets.filter(t => t.status === 'closed').length;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Support Tickets</h1>
          <p className="page-subtitle">Track, manage, and follow up on your support requests</p>
        </div>
        <Link to="/tickets/new" className="btn btn-primary">
          <PlusCircle size={18} />
          <span>New Ticket</span>
        </Link>
      </div>

      {/* Summary KPI Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Total Tickets</span>
          <span className="stat-value">{totalCount}</span>
        </div>
        <div className="stat-card stat-card-open">
          <span className="stat-label">Open</span>
          <span className="stat-value">{openCount}</span>
        </div>
        <div className="stat-card stat-card-progress">
          <span className="stat-label">In Progress</span>
          <span className="stat-value">{progressCount}</span>
        </div>
        <div className="stat-card stat-card-closed">
          <span className="stat-label">Closed</span>
          <span className="stat-value">{closedCount}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        <form onSubmit={handleSearchSubmit} className="search-form">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search tickets by subject or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="btn btn-secondary">Search</button>
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

          <button onClick={fetchTickets} className="btn btn-icon" title="Refresh tickets">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Ticket List */}
      {error && (
        <div className="alert alert-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading your tickets...</p>
        </div>
      ) : tickets.length === 0 ? (
        <div className="empty-state">
          <MessageSquare size={48} className="empty-icon" />
          <h3>No tickets found</h3>
          <p>You haven't submitted any tickets matching the current criteria.</p>
          <Link to="/tickets/new" className="btn btn-primary mt-4">
            <PlusCircle size={18} />
            <span>Submit a Ticket</span>
          </Link>
        </div>
      ) : (
        <div className="table-card">
          <table className="tickets-table">
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Subject</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Assigned Agent</th>
                <th>Created</th>
                <th>Action</th>
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
                    {ticket.description && (
                      <p className="description-preview">
                        {ticket.description.length > 70 ? `${ticket.description.substring(0, 70)}...` : ticket.description}
                      </p>
                    )}
                  </td>
                  <td>
                    <PriorityBadge priority={ticket.priority} />
                  </td>
                  <td>
                    <StatusBadge status={ticket.status} />
                  </td>
                  <td>
                    <span className="agent-text">
                      {ticket.assigned_agent_name || 'Awaiting assignment'}
                    </span>
                  </td>
                  <td className="date-cell">
                    <div className="date-wrapper">
                      <Calendar size={14} />
                      <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td>
                    <Link to={`/tickets/${ticket.id}`} className="btn btn-sm btn-outline">
                      <span>View</span>
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

export default CustomerDashboard;

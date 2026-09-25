import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, PriorityBadge } from '../components/StatusBadge';
import { 
  ArrowLeft, MessageSquare, Send, User, Shield, Calendar, 
  Clock, AlertCircle, CheckCircle2, Save, Trash2 
} from 'lucide-react';

const TicketDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [agents, setAgents] = useState([]);
  const [newComment, setNewComment] = useState('');
  
  // Agent edit states
  const [editStatus, setEditStatus] = useState('');
  const [editPriority, setEditPriority] = useState('');
  const [editAssignedTo, setEditAssignedTo] = useState('');

  const [loading, setLoading] = useState(true);
  const [commenting, setCommenting] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isAgent = user?.role === 'agent';

  const fetchTicketData = async () => {
    try {
      setLoading(true);
      setError('');

      const [ticketRes, commentsRes] = await Promise.all([
        api.get(`/tickets/${id}`),
        api.get(`/tickets/${id}/comments`)
      ]);

      setTicket(ticketRes.data);
      setComments(commentsRes.data);
      setEditStatus(ticketRes.data.status);
      setEditPriority(ticketRes.data.priority);
      setEditAssignedTo(ticketRes.data.assigned_to || '');

      if (isAgent) {
        const agentsRes = await api.get('/users?role=agent');
        setAgents(agentsRes.data);
      }
    } catch (err) {
      if (err.response?.status === 403) {
        setError('Access Forbidden: You do not have permission to view this ticket.');
      } else if (err.response?.status === 404) {
        setError('Ticket not found.');
      } else {
        setError(err.response?.data?.error || 'Failed to load ticket details.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicketData();
  }, [id]);

  const handleUpdateTicket = async (e) => {
    e.preventDefault();
    try {
      setUpdating(true);
      setSuccess('');
      setError('');

      await api.put(`/tickets/${id}`, {
        status: editStatus,
        priority: editPriority,
        assigned_to: editAssignedTo ? Number(editAssignedTo) : null
      });

      setSuccess('Ticket settings updated successfully');
      setTicket((prev) => ({
        ...prev,
        status: editStatus,
        priority: editPriority,
        assigned_to: editAssignedTo ? Number(editAssignedTo) : null,
        assigned_agent_name: agents.find(a => a.id === Number(editAssignedTo))?.name || prev.assigned_agent_name
      }));

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update ticket');
    } finally {
      setUpdating(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setCommenting(true);
      setError('');

      await api.post(`/tickets/${id}/comments`, {
        comment: newComment.trim()
      });

      setNewComment('');
      // Refresh comments list
      const res = await api.get(`/tickets/${id}/comments`);
      setComments(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit comment');
    } finally {
      setCommenting(false);
    }
  };

  const handleDeleteTicket = async () => {
    if (!window.confirm('Are you sure you want to delete this ticket? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/tickets/${id}`);
      navigate(isAgent ? '/agent/dashboard' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete ticket');
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading ticket discussion...</p>
        </div>
      </div>
    );
  }

  if (error && !ticket) {
    return (
      <div className="page-container">
        <Link to={isAgent ? '/agent/dashboard' : '/dashboard'} className="back-link">
          <ArrowLeft size={16} />
          <span>Back to Dashboard</span>
        </Link>
        <div className="alert alert-error mt-4">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="detail-top-nav">
        <Link to={isAgent ? '/agent/dashboard' : '/dashboard'} className="back-link">
          <ArrowLeft size={16} />
          <span>Back to {isAgent ? 'Agent Queue' : 'My Tickets'}</span>
        </Link>

        {isAgent && (
          <button onClick={handleDeleteTicket} className="btn-danger-link">
            <Trash2 size={16} />
            <span>Delete Ticket</span>
          </button>
        )}
      </div>

      {success && (
        <div className="alert alert-success">
          <CheckCircle2 size={18} />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <div className="detail-layout">
        {/* Main Discussion Column */}
        <div className="detail-main">
          <div className="ticket-header-card">
            <div className="ticket-meta-tags">
              <span className="ticket-id-tag">Ticket #{ticket.id}</span>
              <PriorityBadge priority={ticket.priority} />
              <StatusBadge status={ticket.status} />
            </div>

            <h1 className="ticket-title">{ticket.subject}</h1>

            <div className="ticket-author-row">
              <div className="author-box">
                <div className="avatar-circle">
                  <User size={16} />
                </div>
                <div>
                  <span className="author-name">{ticket.customer_name}</span>
                  <span className="author-email">{ticket.customer_email}</span>
                </div>
              </div>

              <div className="timestamp-box">
                <Calendar size={14} />
                <span>Opened {new Date(ticket.created_at).toLocaleString()}</span>
              </div>
            </div>

            <div className="ticket-body">
              <p>{ticket.description || 'No description provided.'}</p>
            </div>
          </div>

          {/* Comments & Activity Stream */}
          <div className="comments-section">
            <div className="section-title">
              <MessageSquare size={20} />
              <h2>Activity & Discussion ({comments.length})</h2>
            </div>

            <div className="comments-stream">
              {comments.length === 0 ? (
                <div className="empty-comments">
                  <p>No comments posted yet. Start the conversation below.</p>
                </div>
              ) : (
                comments.map((c) => {
                  const isCommentAgent = c.user_role === 'agent';
                  return (
                    <div 
                      key={c.id} 
                      className={`comment-card ${isCommentAgent ? 'comment-agent' : 'comment-customer'}`}
                    >
                      <div className="comment-header">
                        <div className="commenter-meta">
                          <span className="commenter-name">{c.user_name}</span>
                          <span className={`role-badge ${isCommentAgent ? 'role-agent' : 'role-customer'}`}>
                            {isCommentAgent ? <Shield size={12} /> : <User size={12} />}
                            {isCommentAgent ? 'Agent' : 'Customer'}
                          </span>
                        </div>
                        <span className="comment-time">
                          <Clock size={12} />
                          {new Date(c.created_at).toLocaleString()}
                        </span>
                      </div>
                      <div className="comment-text">
                        {c.comment}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Comment Form */}
            <form onSubmit={handleAddComment} className="comment-form">
              <h3>Add a Response</h3>
              <textarea
                rows={4}
                placeholder="Write your update or reply here..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                disabled={commenting}
                required
              />
              <div className="comment-form-actions">
                <button type="submit" className="btn btn-primary" disabled={commenting || !newComment.trim()}>
                  <Send size={15} />
                  <span>{commenting ? 'Posting...' : 'Post Response'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Sidebar Controls */}
        <div className="detail-sidebar">
          {isAgent ? (
            <div className="sidebar-card">
              <h3>Agent Controls</h3>
              <form onSubmit={handleUpdateTicket} className="sidebar-form">
                <div className="form-group">
                  <label htmlFor="editStatus">Status</label>
                  <select
                    id="editStatus"
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="select-input"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="editPriority">Priority</label>
                  <select
                    id="editPriority"
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value)}
                    className="select-input"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="editAssignedTo">Assign Agent</label>
                  <select
                    id="editAssignedTo"
                    value={editAssignedTo}
                    onChange={(e) => setEditAssignedTo(e.target.value)}
                    className="select-input"
                  >
                    <option value="">-- Unassigned --</option>
                    {agents.map((ag) => (
                      <option key={ag.id} value={ag.id}>
                        {ag.name} ({ag.email})
                      </option>
                    ))}
                  </select>
                </div>

                <button type="submit" className="btn btn-primary btn-block" disabled={updating}>
                  <Save size={16} />
                  <span>{updating ? 'Saving...' : 'Update Ticket'}</span>
                </button>
              </form>
            </div>
          ) : (
            <div className="sidebar-card info-sidebar">
              <h3>Ticket Information</h3>
              <div className="info-list">
                <div className="info-item">
                  <span className="info-label">Assigned Agent</span>
                  <span className="info-val">{ticket.assigned_agent_name || 'Unassigned'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Status</span>
                  <StatusBadge status={ticket.status} />
                </div>
                <div className="info-item">
                  <span className="info-label">Priority</span>
                  <PriorityBadge priority={ticket.priority} />
                </div>
                <div className="info-item">
                  <span className="info-label">Last Updated</span>
                  <span className="info-val">{new Date(ticket.updated_at || ticket.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TicketDetail;

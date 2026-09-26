import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/client';
import { ArrowLeft, Send, AlertCircle } from 'lucide-react';
import { TicketFlowIcon } from '../components/Logo';

const CreateTicket = () => {
  const [subject, setSubject] = useState('');
  const [priority, setPriority] = useState('medium');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!subject.trim()) {
      setError('Please provide a descriptive subject for your issue.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/tickets', {
        subject: subject.trim(),
        priority,
        description: description.trim()
      });

      navigate(`/tickets/${res.data.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit ticket. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container form-page-container">
      <Link to="/dashboard" className="back-link">
        <ArrowLeft size={16} />
        <span>Back to My Tickets</span>
      </Link>

      <div className="card form-card">
        <div className="card-header">
          <div className="header-icon">
            <TicketFlowIcon size={24} />
          </div>
          <div>
            <h2>Create New Support Ticket</h2>
            <p>Describe your question or issue, and our support team will respond promptly.</p>
          </div>
        </div>

        {error && (
          <div className="alert alert-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="standard-form">
          <div className="form-group">
            <label htmlFor="subject">Subject <span className="required">*</span></label>
            <input
              id="subject"
              type="text"
              placeholder="Brief summary of your issue (e.g. Cannot reset password)"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="priority">Priority</label>
            <select
              id="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              disabled={loading}
              className="select-input"
            >
              <option value="low">Low - General inquiry or minor suggestion</option>
              <option value="medium">Medium - Standard issue requiring investigation</option>
              <option value="high">High - Critical failure or system blocking problem</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="description">Detailed Description</label>
            <textarea
              id="description"
              rows={6}
              placeholder="Please provide steps to reproduce, error messages received, or any helpful context..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="form-actions">
            <Link to="/dashboard" className="btn btn-secondary">
              Cancel
            </Link>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <Send size={16} />
              <span>{loading ? 'Submitting...' : 'Submit Ticket'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTicket;

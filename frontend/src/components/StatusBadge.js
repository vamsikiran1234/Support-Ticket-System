import React from 'react';

export const StatusBadge = ({ status }) => {
  const formatStatus = (s) => {
    switch (s) {
      case 'open':
        return { label: 'Open', className: 'badge-status-open' };
      case 'in_progress':
        return { label: 'In Progress', className: 'badge-status-progress' };
      case 'closed':
        return { label: 'Closed', className: 'badge-status-closed' };
      default:
        return { label: s || 'Unknown', className: 'badge-status-default' };
    }
  };

  const { label, className } = formatStatus(status);
  return <span className={`badge ${className}`}>{label}</span>;
};

export const PriorityBadge = ({ priority }) => {
  const formatPriority = (p) => {
    switch (p) {
      case 'high':
        return { label: 'High', className: 'badge-priority-high' };
      case 'medium':
        return { label: 'Medium', className: 'badge-priority-medium' };
      case 'low':
        return { label: 'Low', className: 'badge-priority-low' };
      default:
        return { label: p || 'Medium', className: 'badge-priority-medium' };
    }
  };

  const { label, className } = formatPriority(priority);
  return <span className={`badge ${className}`}>{label}</span>;
};

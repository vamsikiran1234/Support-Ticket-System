import React from 'react';

/**
 * Modern, professional brand mark for TicketFlow.
 * Combines an iconic support ticket voucher with a dynamic forward workflow indicator.
 */
export const TicketFlowIcon = ({ size = 24, className = "" }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ verticalAlign: 'middle' }}
    >
      <path
        d="M2 9C3.65685 9 5 7.65685 5 6C5 4.34315 3.65685 3 2 3H22C20.3431 3 19 4.34315 19 6C19 7.65685 20.3431 9 22 9V15C20.3431 15 19 16.3431 19 18C19 19.6569 20.3431 21 22 21H2C3.65685 21 5 19.6569 5 18C5 16.3431 3.65685 15 2 15V9Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 8.5L14.5 12L9.5 15.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const TicketFlowBrand = ({ size = 24, showText = true, className = "" }) => {
  return (
    <div className={`brand-wrapper ${className}`}>
      <div className="brand-icon-box">
        <TicketFlowIcon size={size} />
      </div>
      {showText && <span className="brand-text">TicketFlow</span>}
    </div>
  );
};

export default TicketFlowIcon;
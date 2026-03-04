import React from 'react';
import { Link } from 'react-router-dom';
import './Logo.css';

const Logo = ({ variant = 'default', size = 'medium' }) => {
  return (
    <Link to="/" className={`logo logo-${variant} logo-${size}`}>
      <div className="logo-icon">
        <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M20 4L4 12V28L20 36L36 28V12L20 4Z"
            fill="currentColor"
            opacity="0.2"
          />
          <path
            d="M20 4L4 12V28L20 36L36 28V12L20 4Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <circle cx="20" cy="20" r="6" fill="currentColor" />
        </svg>
      </div>
      <span className="logo-text">
        <span className="logo-primary">Placements</span>
        <span className="logo-secondary">Portal</span>
      </span>
    </Link>
  );
};

export default Logo;

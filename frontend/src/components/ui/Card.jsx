import React from 'react';
import '../../assets/styles/components/ui/Card.css';

export default function Card({ title, subtitle, children, onClick, className }) {
  const clickClass = onClick ? 'clickable' : '';
  return (
    <div className={`card-ui ${className || ''} ${clickClass}`.trim()} onClick={onClick}>
      {(title || subtitle) && (
        <div className="card-ui__head">
          {title && <h3>{title}</h3>}
          {subtitle && <p>{subtitle}</p>}
        </div>
      )}
      <div className="card-ui__body">{children}</div>
    </div>
  );
}

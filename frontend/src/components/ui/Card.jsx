import React from 'react';
import '../../assets/styles/components/ui/Card.css'

export default function Card({ title, subtitle, children, onClick }) {
  return (
    <div className="card-ui" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
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

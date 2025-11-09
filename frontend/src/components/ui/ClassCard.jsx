import React from 'react';
import '../../assets/styles/components/ui/ClassCard.css';

export default function ClassCard({ title, subtitle, image, onClick, badge, description, className }) {
  const handleKeyPress = (e) => {
    if (!onClick) return;
    if (e.key === 'Enter' || e.key === ' ') onClick();
  };

  const initials = (title || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <div
      className={`class-card ${className || ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyPress={handleKeyPress}
    >
      <div className="class-card__thumb">
        {image ? <img src={image} alt={title} /> : <div className="class-card__placeholder">{initials || 'NA'}</div>}

        {badge && <div className="class-card__badge">{badge}</div>}
      </div>

      <div className="class-card__meta">
        <div className="class-card__title">{title}</div>
        {subtitle && <div className="class-card__subtitle">{subtitle}</div>}
        {description && <div className="class-card__desc">{description}</div>}
      </div>
    </div>
  );
}

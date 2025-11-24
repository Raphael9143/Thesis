import React, { useMemo } from 'react';
import '../../assets/styles/components/ui/ClassCard.css';

export default function ClassCard({
  title,
  subtitle,
  code,
  image,
  onClick,
  badge,
  description,
  className,
  maxDescriptionChars = 26,
}) {
  const role =
    typeof window !== 'undefined' && sessionStorage.getItem('role')
      ? sessionStorage.getItem('role').toString().toLowerCase()
      : null;
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

  const normalizedDesc = useMemo(() => {
    if (!description) return '';
    const replaced = description.replace(/\\n/g, '\n');
    return replaced.length > maxDescriptionChars
      ? replaced.slice(0, maxDescriptionChars).trimEnd() + '…'
      : replaced;
  }, [description, maxDescriptionChars]);

  return (
    <div
      className={`class-card ${className || ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyPress={handleKeyPress}
    >
      <div className="class-card__thumb">
        {image ? (
          <img src={image} alt={title} />
        ) : (
          <div className="class-card__placeholder">{initials || 'NA'}</div>
        )}

        {code && role === 'teacher' && <div className="class-card__code">{code}</div>}

        {badge && <div className="class-card__badge">{badge.toUpperCase()}</div>}
      </div>

      <div className="class-card__meta">
        <div className="class-card__title">{title}</div>
        {subtitle && <div className="class-card__subtitle">{subtitle}</div>}
        {description && (
          <div className="class-card__desc" title={description}>
            {normalizedDesc}
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useMemo, useState } from 'react';
import '../../assets/styles/components/ui/ClassCard.css';
import userAPI from '../../../services/userAPI';

export default function ClassCard({
  title,
  subtitle,
  code,
  image,
  onClick,
  badge,
  id,
  resourceType, // 'class' or 'course' or 'project'
  description,
  className,
  maxDescriptionChars = 26,
  onToggleStatus,
}) {
  const role =
    typeof window !== 'undefined' && sessionStorage.getItem('role')
      ? sessionStorage.getItem('role').toString().toLowerCase()
      : null;
  const [status, setStatus] = useState(badge);
  const [statusLoading, setStatusLoading] = useState(false);
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

        {status &&
        status.toString().toLowerCase() === 'draft' &&
        (onToggleStatus || role === 'teacher') ? (
          <div
            className={`class-card__badge class-card__badge--clickable ${
              statusLoading ? 'is-loading' : ''
            }`}
            onClick={async (e) => {
              e.stopPropagation();
              if (!id || statusLoading) return;
              // confirm before activating a draft
              if (!window.confirm('Activate this draft? This will make it active. Continue?'))
                return;
              try {
                setStatusLoading(true);
                if (onToggleStatus) {
                  // delegate status change to parent (e.g., projects list)
                  await onToggleStatus(id);
                } else {
                  // fallback behavior for teacher/course/class
                  if (resourceType === 'course') {
                    await userAPI.patchCourseStatus(id, 'active');
                  } else {
                    await userAPI.patchClassStatus(id, 'active');
                  }
                }
                setStatus('active');
              } catch (err) {
                console.error('Failed to change status', err);
              } finally {
                setStatusLoading(false);
              }
            }}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.currentTarget.click();
              }
            }}
          >
            {status.toUpperCase()}
          </div>
        ) : (
          status && <div className="class-card__badge">{status.toUpperCase()}</div>
        )}
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

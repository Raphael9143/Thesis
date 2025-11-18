export default function useDueDateStatus(dueDateISO) {
  if (!dueDateISO) return { formatted: 'No due date', daysLeft: null, status: 'normal', className: '' };

  const due = new Date(dueDateISO);
  const now = new Date();
  // Compute difference in days (floor)
  const msPerDay = 1000 * 60 * 60 * 24;
  const diffMs = due - now;
  const daysLeftRaw = Math.ceil(diffMs / msPerDay);

  let status = 'normal';
  let className = '';
  const daysLeft = daysLeftRaw;

  // Past due: show Expired in red and no negative days
  if (diffMs < 0) {
    status = 'expired';
    className = 'due-date--urgent';
    return { formatted: 'Expired', daysLeft: null, status, className };
  }

  if (daysLeftRaw <= 3) {
    status = 'urgent';
    className = 'due-date--urgent';
  } else if (daysLeftRaw <= 7) {
    status = 'warning';
    className = 'due-date--warning';
  }

  // Format date as local string (short)
  const formatted = due.toLocaleString();

  return { formatted, daysLeft, status, className };
}

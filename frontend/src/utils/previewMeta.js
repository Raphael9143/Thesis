const pad = (n) => {
  return n.toString().padStart(2, '0');
};

const formatShort = (dateLike) => {
  if (!dateLike) return '';
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return '';
  const month = d.toLocaleString('en-US', { month: 'short' });
  const day = d.getDate();
  let hour = d.getHours();
  const minute = pad(d.getMinutes());
  const ampm = hour >= 12 ? 'pm' : 'am';
  hour = hour % 12 || 12;
  return `${month} ${day} at ${hour}:${minute}${ampm}`;
};

const formatAvailable = (start, end, alwaysAvailableLabel = 'Available') => {
  if (!start && !end) return alwaysAvailableLabel;

  if (start && end) {
    return `${formatShort(start)} - ${formatShort(end)}`;
  }

  if (end) {
    return `until ${formatShort(end)}`;
  }

  if (start) {
    return `from ${formatShort(start)}`;
  }

  return alwaysAvailableLabel;
};

const formatDue = (due) => {
  if (!due) return 'No due date';
  const s = formatShort(due);
  return s || 'No due date';
};

export { formatAvailable, formatDue, formatShort };
export default { formatAvailable, formatDue, formatShort };

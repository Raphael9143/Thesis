/**
 * Format status strings from UPPER_SNAKE_CASE to Title Case
 * @param {string} status - Status string like 'PENDING', 'NEEDS_EDIT'
 * @returns {string} Formatted status like 'Pending', 'Needs Edit'
 */
export default function formatStatus(status) {
  if (!status || typeof status !== 'string') return '';

  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

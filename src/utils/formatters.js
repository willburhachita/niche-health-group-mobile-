export function getInitials(name) {
  if (!name) return '?';
  const parts = name.replace(/^(Dr\.|Nurse|Pharmacist|Mr\.|Mrs\.|Ms\.)\s*/i, '').trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return parts[0].substring(0, 2).toUpperCase();
}

export function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export function maskPhone(phone) {
  if (!phone || phone.length < 6) return phone;
  return phone.substring(0, 4) + '*** ***' + phone.substring(phone.length - 3);
}

export function truncate(text, maxLength = 50) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

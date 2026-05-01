export function formatTimestamp(timestamp: number) {
  return new Intl.DateTimeFormat('default', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(timestamp));
}

export function nanoid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function downloadJSON(data: unknown, fileName: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

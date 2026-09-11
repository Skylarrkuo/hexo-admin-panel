export function dateKey(value, timeZone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(new Date(value));
  const get = type => parts.find(part => part.type === type).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

export function scheduleTime(item) {
  return item.status === 'retrying' ? item.nextAttemptAt || item.publishAt : item.publishAt || item.nextAttemptAt;
}

// Calendar cells are civil dates, advanced in UTC to avoid browser timezone/DST
// affecting the grid. Only actual instants are converted through the site zone.
export function publishingCalendar(items, timeZone, monthOffset = 0, now = new Date()) {
  const today = dateKey(now, timeZone);
  const [year, month] = today.split('-').map(Number);
  const viewedMonth = new Date(Date.UTC(year, month - 1 + monthOffset, 1));
  const first = new Date(viewedMonth);
  first.setUTCDate(1 - first.getUTCDay());
  const grouped = new Map();
  for (const item of items) {
    const value = scheduleTime(item);
    if (!value || Number.isNaN(new Date(value).getTime())) continue;
    const key = dateKey(value, timeZone);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(item);
  }
  const cells = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(first);
    date.setUTCDate(first.getUTCDate() + index);
    const key = date.toISOString().slice(0, 10);
    return { key, day: date.getUTCDate(), current: date.getUTCMonth() === viewedMonth.getUTCMonth(), today: key === today, tasks: grouped.get(key) || [] };
  });
  return { viewedMonth, cells };
}

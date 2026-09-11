import { describe, expect, it } from 'vitest';
import { dateKey, publishingCalendar } from './publishing-calendar';

describe('site timezone calendar', () => {
  it('places Shanghai midnight and evening tasks on the same civil day', () => {
    const items = [
      { id: 'midnight', publishAt: '2026-09-09T16:00:00Z' },
      { id: 'evening', publishAt: '2026-09-10T12:00:00Z' }
    ];
    for (const now of ['2026-09-09T17:00:00Z', '2026-09-10T12:00:00Z']) {
      const { cells } = publishingCalendar(items, 'Asia/Shanghai', 0, now);
      const cell = cells.find(item => item.key === '2026-09-10');
      expect(cell.today).toBe(true);
      expect(cell.tasks.map(item => item.id)).toEqual(['midnight', 'evening']);
    }
  });

  it('uses the site month even if UTC is in the following year', () => {
    const { viewedMonth, cells } = publishingCalendar([], 'America/Los_Angeles', 0, '2027-01-01T01:00:00Z');
    expect(viewedMonth.toISOString()).toBe('2026-12-01T00:00:00.000Z');
    expect(cells.find(item => item.today).key).toBe('2026-12-31');
  });

  it('keeps distinct civil dates across DST and puts retries on their next attempt day', () => {
    const items = [{ id: 'retry', status: 'retrying', publishAt: '2026-03-07T23:00:00-05:00', nextAttemptAt: '2026-03-08T03:30:00-04:00' }];
    const { cells } = publishingCalendar(items, 'America/New_York', 0, '2026-03-08T12:00:00Z');
    expect(new Set(cells.map(item => item.key)).size).toBe(42);
    expect(cells.find(item => item.key === '2026-03-08').tasks).toEqual(items);
    expect(cells.find(item => item.key === '2026-03-07').tasks).toEqual([]);
    expect(dateKey('2026-11-01T05:30:00Z', 'America/New_York')).toBe('2026-11-01');
    expect(dateKey('2026-11-01T06:30:00Z', 'America/New_York')).toBe('2026-11-01');
  });
});

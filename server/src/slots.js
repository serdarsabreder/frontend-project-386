export const SLOT_MINUTES = 30;
export const BUSINESS_START_HOUR = 9;
export const BUSINESS_END_HOUR = 18;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const SLOT_ID_RE = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2}):00\.000Z$/;

export function isValidDateString(date) {
  if (typeof date !== 'string' || !DATE_RE.test(date)) {
    return false;
  }
  const [year, month, day] = date.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

// Generates the 30-minute schedule (09:00–18:00) for a calendar date.
// Slots are expressed in UTC so the output is deterministic regardless of the
// server's timezone. Booked start times are flagged with status "booked".
export function generateSlots(date, bookedStarts = []) {
  const booked = new Set(bookedStarts);
  const [year, month, day] = date.split('-').map(Number);
  const slots = [];

  for (let hour = BUSINESS_START_HOUR; hour < BUSINESS_END_HOUR; hour += 1) {
    for (const minute of [0, 30]) {
      const start = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
      const end = new Date(start.getTime() + SLOT_MINUTES * 60 * 1000);
      const startIso = start.toISOString();

    slots.push({
      id: startIso,
      start: startIso,
      end: end.toISOString(),
      status: booked.has(startIso) ? 'booked' : 'available',
    });
    }
  }

  return slots;
}

// Parses a slotId into its date part, or null when it is malformed.
export function parseSlotId(slotId) {
  if (typeof slotId !== 'string') {
    return null;
  }
  const match = SLOT_ID_RE.exec(slotId);
  if (!match) {
    return null;
  }
  const [, date] = match;
  if (!isValidDateString(date)) {
    return null;
  }
  return { date };
}

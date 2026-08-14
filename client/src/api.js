const BASE = '/api';

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
  } catch {
    throw new Error('Cannot reach the server. Is it running?');
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const error = new Error(data?.error || 'Something went wrong.');
    error.status = res.status;
    throw error;
  }
  return data;
}

export const getOwner = () => request('/owner');

export const listEventTypes = () => request('/event-types');

export const createEventType = (payload) =>
  request('/event-types', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const listSlots = (eventTypeId, date) => {
  const qs = date ? `&date=${encodeURIComponent(date)}` : '';
  return request(`/slots?eventTypeId=${encodeURIComponent(eventTypeId)}${qs}`);
};

export const createBooking = (payload) =>
  request('/bookings', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const listBookings = () => request('/bookings');

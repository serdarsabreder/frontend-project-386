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

export const listSlots = (date) =>
  request(`/slots?date=${encodeURIComponent(date)}`);

export const createBooking = (payload) =>
  request('/bookings', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const listBookings = () => request('/bookings');

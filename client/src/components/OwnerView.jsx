import { useEffect, useState } from 'react';
import { createEventType, listBookings, listEventTypes } from '../api.js';

export default function OwnerView() {
  const [eventTypes, setEventTypes] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [form, setForm] = useState({ name: '', description: '', durationMinutes: 30 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  const reload = async () => {
    setError(null);
    try {
      const [types, meetings] = await Promise.all([listEventTypes(), listBookings()]);
      setEventTypes(types);
      setBookings(meetings);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    try {
      const created = await createEventType({
        name: form.name,
        description: form.description || undefined,
        durationMinutes: Number(form.durationMinutes),
      });
      setNotice(`Event type "${created.name}" created.`);
      setForm({ name: '', description: '', durationMinutes: 30 });
      reload();
    } catch (err) {
      setError(err.message);
    }
  };

  const typeName = (id) => eventTypes.find((et) => et.id === id)?.name || `#${id}`;

  return (
    <div className="card">
      <div className="event-header">
        <div className="event-title">Owner dashboard</div>
        <div className="event-meta">
          <span className="timezone">🌐 {Intl.DateTimeFormat().resolvedOptions().timeZone}</span>
        </div>
      </div>

      {notice && <div className="notice">{notice}</div>}
      {error && <div className="notice error">{error}</div>}

      <div className="owner-section">
        <h3 className="owner-title">Meeting types</h3>
        <form className="owner-form" onSubmit={handleCreate}>
          <input
            type="text"
            placeholder="Name (e.g. 30 Min Meeting)"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="Description (optional)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <input
            type="number"
            min="1"
            max="480"
            value={form.durationMinutes}
            onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })}
            aria-label="Duration in minutes"
          />
          <button type="submit" className="button primary">Create type</button>
        </form>
        {eventTypes.length > 0 && (
          <ul className="owner-types">
            {eventTypes.map((et) => (
              <li key={et.id}>
                <span className="type-name">{et.name}</span>
                <span className="text-muted">{et.durationMinutes} min</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <hr className="divider" />

      <div className="owner-section">
        <h3 className="owner-title">Upcoming meetings</h3>
        {loading && <p className="text-muted">Loading…</p>}
        {!loading && bookings.length === 0 && <p className="text-muted">No upcoming meetings yet.</p>}
        {!loading && bookings.length > 0 && (
          <table className="bookings-table">
            <thead>
              <tr>
                <th>When</th>
                <th>Type</th>
                <th>Guest</th>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => {
                const start = new Date(b.start);
                const end = new Date(b.end);
                const date = start.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });
                const time = `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                return (
                  <tr key={b.id}>
                    <td>
                      <div className="booking-date">{date}</div>
                      <div className="text-muted">{time}</div>
                    </td>
                    <td>{typeName(b.eventTypeId)}</td>
                    <td>{b.name}</td>
                    <td className="text-muted">{b.email || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="cal-footer">
        <span className="logo-mark">CB</span>
        <span>Call Booking</span>
      </div>
    </div>
  );
}

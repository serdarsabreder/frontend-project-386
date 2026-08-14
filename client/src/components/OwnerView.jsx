import { useEffect, useState } from 'react';

function formatDate(iso) {
  return new Date(iso).toLocaleDateString([], {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function OwnerView({ api }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api()
      .then((data) => {
        if (!cancelled) setBookings(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [api]);

  return (
    <section className="card">
      <div className="card-header">
        <div>
          <h2>Upcoming meetings</h2>
          <p className="muted">Every booked call, ordered by start time.</p>
        </div>
      </div>

      {loading && <p className="muted">Loading meetings…</p>}
      {error && <div className="alert">{error}</div>}
      {!loading && !error && bookings.length === 0 && (
        <p className="muted">No upcoming meetings yet.</p>
      )}

      {!loading && bookings.length > 0 && (
        <table className="bookings">
          <thead>
            <tr>
              <th>When</th>
              <th>Guest</th>
              <th>Email</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => (
              <tr key={booking.id}>
                <td>
                  <span className="booking-date">{formatDate(booking.start)}</span>
                  <span className="booking-time">
                    {formatTime(booking.start)} – {formatTime(booking.end)}
                  </span>
                </td>
                <td>{booking.name}</td>
                <td className="muted">{booking.email || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

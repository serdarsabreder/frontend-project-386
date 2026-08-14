import { useCallback, useEffect, useMemo, useState } from 'react';
import { listSlots } from '../api.js';
import BookingModal from './BookingModal.jsx';
import Toast from './Toast.jsx';

const DAY_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function localDateString(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function timezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'Local time';
  }
}

export default function BookingPage({ eventType, owner, onBack }) {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [toast, setToast] = useState(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listSlots(eventType.id);
      setSlots(data.slots);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [eventType.id]);

  useEffect(() => {
    reload();
  }, [reload]);

  // Group slots by LOCAL calendar date so the grid lines up with the browser timezone.
  const days = useMemo(() => {
    const byDate = new Map();
    for (const slot of slots) {
      const date = localDateString(new Date(slot.start));
      if (!byDate.has(date)) byDate.set(date, []);
      byDate.get(date).push(slot);
    }
    return [...byDate.entries()]
      .map(([date, daySlots]) => {
        const d = new Date(`${date}T00:00:00`);
        return {
          date,
          weekday: d.getDay(), // 0 = Sun .. 6 = Sat
          number: d.getDate(),
          daySlots: daySlots.sort((a, b) => a.start.localeCompare(b.start)),
        };
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [slots]);

  const today = useMemo(() => localDateString(new Date()), []);

  const selected = days.find((d) => d.date === selectedDate) || days[0];

  useEffect(() => {
    if (days.length > 0 && !days.some((d) => d.date === selectedDate)) {
      setSelectedDate(days[0].date);
    }
  }, [days, selectedDate]);

  const grid = useMemo(() => {
    if (days.length === 0) return [];
    const leadingEmpty = (days[0].weekday + 6) % 7; // Monday-based offset
    const cells = [];
    for (let i = 0; i < leadingEmpty; i += 1) cells.push({ empty: true, key: `lead-${i}` });
    for (const day of days) cells.push({ day, key: day.date });
    while (cells.length % 7 !== 0) cells.push({ empty: true, key: `trail-${cells.length}` });
    return cells;
  }, [days]);

  const handleBooked = useCallback(
    (message, kind) => {
      setSelectedSlot(null);
      setToast({ message, kind });
      reload();
    },
    [reload],
  );

  return (
    <div className="card">
      <button type="button" className="back-link" onClick={onBack}>
        ← All meeting types
      </button>

      <div className="event-header">
        <div className="event-title">
          {owner.name}
          <span className="badge">{eventType.name}</span>
        </div>
        <div className="event-meta">
          <span>
            <span className="icon">⏱️</span> {eventType.durationMinutes}m
          </span>
          <span>
            <span className="icon">📹</span> Online
          </span>
          <span className="timezone">🌐 {timezone()}</span>
        </div>
      </div>

      {error && <div className="notice error">{error}</div>}

      <div className="week-grid">
        {DAY_LABELS.map((label) => (
          <span key={label} className="day-label">
            {label}
          </span>
        ))}
        {grid.map((cell) =>
          cell.empty ? (
            <span key={cell.key} className="day-number empty" />
          ) : (
            <button
              key={cell.key}
              type="button"
              className={`day-number ${cell.day.date === today ? 'today' : ''} ${
                cell.day.date === selected?.date ? 'selected' : ''
              }`}
              onClick={() => setSelectedDate(cell.day.date)}
            >
              {cell.day.number}
            </button>
          ),
        )}
      </div>

      <hr className="divider" />

      {loading ? (
        <p className="text-muted">Loading available times…</p>
      ) : !selected ? (
        <p className="text-muted">No available slots in the next 14 days.</p>
      ) : (
        <div className="day-time-row">
          <div className="day-column">
            <span className="day-name">{WEEKDAY_NAMES[selected.weekday]}</span>
            <span className="date-num">{String(selected.number).padStart(2, '0')}</span>
          </div>
          <div className="time-slots">
            {selected.daySlots.map((slot) => {
              const taken = slot.status === 'booked';
              return (
                <button
                  key={slot.id}
                  type="button"
                  className={`time-slot ${taken ? 'taken' : ''}`}
                  disabled={taken}
                  onClick={() => setSelectedSlot(slot)}
                >
                  <span className="time-label">{formatTime(slot.start)}</span>
                  <span className="slot-meta">
                    <span className="dot" />
                    <span className="badge-duration">{eventType.durationMinutes}m</span>
                  </span>
                </button>
              );
            })}
            {selected.daySlots.length === 0 && (
              <p className="text-muted">No times available on this day.</p>
            )}
          </div>
        </div>
      )}

      <div className="cal-footer">
        <span className="logo-mark">CB</span>
        <span>Call Booking</span>
      </div>

      {selectedSlot && (
        <BookingModal
          eventType={eventType}
          slot={selectedSlot}
          onClose={() => setSelectedSlot(null)}
          onBooked={handleBooked}
        />
      )}
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
